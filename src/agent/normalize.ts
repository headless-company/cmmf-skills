import { isValidIdentifier, normalizeIdentifier } from "../utils/strings.js";

function normalizeId(value: unknown): unknown {
  if (typeof value !== "string" || isValidIdentifier(value)) {
    return value;
  }
  return normalizeIdentifier(value);
}

function normalizeEditorial(value: unknown, fieldIds: Map<string, string>): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const editorial = { ...value } as Record<string, unknown>;
  if (typeof editorial.labelField === "string") {
    editorial.labelField = fieldIds.get(editorial.labelField) ?? normalizeId(editorial.labelField);
  }

  return editorial;
}

function normalizeField(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const field = { ...value } as Record<string, unknown>;
  field.id = normalizeId(field.id);
  field.objectType = normalizeId(field.objectType);

  if (Array.isArray(field.targets)) {
    field.targets = field.targets.map((target) => normalizeId(target));
  }

  if (field.editorial) {
    field.editorial = normalizeEditorial(field.editorial, new Map());
  }

  return field;
}

function normalizeModel(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const model = { ...value } as Record<string, unknown>;
  model.id = normalizeId(model.id);

  const fieldIds = new Map<string, string>();
  if (Array.isArray(model.fields)) {
    model.fields = model.fields.map((field) => {
      const normalizedField = normalizeField(field);
      if (field && typeof field === "object" && !Array.isArray(field)) {
        const rawField = field as Record<string, unknown>;
        if (typeof rawField.id === "string" && normalizedField && typeof normalizedField === "object" && !Array.isArray(normalizedField)) {
          const nextField = normalizedField as Record<string, unknown>;
          if (typeof nextField.id === "string") {
            fieldIds.set(rawField.id, nextField.id);
          }
        }
      }
      return normalizedField;
    });
  }

  if (model.editorial) {
    model.editorial = normalizeEditorial(model.editorial, fieldIds);
  }

  return model;
}

export function normalizeAgentTurnIdentifiers(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const turn = { ...value } as Record<string, unknown>;
  if (turn.type === "request_clarification" && Array.isArray(turn.questions)) {
    turn.questions = turn.questions.map((question) => {
      if (!question || typeof question !== "object" || Array.isArray(question)) {
        return question;
      }
      const nextQuestion = { ...question } as Record<string, unknown>;
      nextQuestion.id = normalizeId(nextQuestion.id);
      return nextQuestion;
    });
    return turn;
  }

  if (turn.type === "submit_change_set" && turn.changeSet && typeof turn.changeSet === "object" && !Array.isArray(turn.changeSet)) {
    const changeSet = { ...(turn.changeSet as Record<string, unknown>) };
    if (Array.isArray(changeSet.models)) {
      changeSet.models = changeSet.models.map((change) => {
        if (!change || typeof change !== "object" || Array.isArray(change)) {
          return change;
        }
        const nextChange = { ...change } as Record<string, unknown>;
        nextChange.model = normalizeModel(nextChange.model);
        return nextChange;
      });
    }
    turn.changeSet = changeSet;
  }

  return turn;
}
