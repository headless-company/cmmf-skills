import { fields, record, repeatable, issue, type Data, type Diagnostic } from "./repository.js";

// Called after schema validation. Check declarations only; never evaluate content or expressions.
export function validateHints(model: Data, file: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const declaredFields = new Map(fields(model).map(field => [field.id, field]));
  const ids = new Set<unknown>();
  const hints = Array.isArray(model.validationHints) ? model.validationHints : [];
  function report(code: string, path: string, message: string): void {
    diagnostics.push(issue(code, file, path, message));
  }
  function resolve(id: unknown, path: string): Data | undefined {
    const field = declaredFields.get(id);
    if (!field) report("VALIDATION_HINT_FIELD_MISSING", path, `Hint references undeclared field ${String(id)}; field IDs are case-sensitive and local to this model.`);
    return field;
  }
  for (const [index, hint] of hints.entries()) {
    if (!record(hint)) continue;
    const base = `/validationHints/${index}`;
    if (ids.has(hint.id)) report("VALIDATION_HINT_ID_DUPLICATE", `${base}/id`, `Hint ${String(hint.id)} is defined more than once in this model.`);
    ids.add(hint.id);
    if (record(hint.then)) for (const [action, targets] of Object.entries(hint.then)) {
      if (Array.isArray(targets)) for (const [i, target] of targets.entries()) resolve(target, `${base}/then/${action}/${i}`);
    }
    const pending = record(hint.when) ? [{ condition: hint.when, path: `${base}/when` }] : [];
    while (pending.length) {
      const { condition, path } = pending.pop()!;
      if (record(condition.not)) pending.push({ condition: condition.not, path: `${path}/not` });
      for (const key of ["allOf", "anyOf"]) {
        const children = condition[key];
        if (Array.isArray(children)) for (const [i, child] of children.entries()) {
          if (record(child)) pending.push({ condition: child, path: `${path}/${key}/${i}` });
        }
      }
      if (condition.field === undefined) continue;
      const field = resolve(condition.field, `${path}/field`);
      if (!field) continue;
      for (const [operator, operand] of Object.entries(condition)) {
        if (operator === "field" || operator === "isEmpty" || operator === "isNotEmpty") continue;
        const scalar = ["equals", "notEquals", "in", "notIn"].includes(operator);
        const allowedTypes = scalar ? ["string", "text", "slug", "enum", "number", "boolean", "date", "datetime"]
          : operator === "matches" ? ["string", "text", "slug", "enum"] : ["number"];
        if (repeatable(field) || !allowedTypes.includes(String(field.type))) {
          report("VALIDATION_HINT_OPERATOR_TYPE", `${path}/${operator}`, `${operator} is incompatible with ${String(field.id)} (${String(field.type)}${repeatable(field) ? " list" : ""}).`);
        } else if (scalar) {
          const expected = field.type === "number" ? "number" : field.type === "boolean" ? "boolean" : "string";
          const values = operator === "in" || operator === "notIn" ? operand as unknown[] : [operand];
          if (values.some(value => value !== null && typeof value !== expected)) report("VALIDATION_HINT_OPERAND_TYPE", `${path}/${operator}`, `Non-null operands for ${String(field.id)} must be ${expected} values; no coercion is performed.`);
        }
        if (operator === "matches" && typeof operand === "string") {
          try { new RegExp(operand); } catch {
            report("VALIDATION_HINT_REGEX_INVALID", `${path}/matches`, "Pattern is not a valid ECMAScript regular expression.");
          }
        }
      }
    }
  }
  return diagnostics;
}
