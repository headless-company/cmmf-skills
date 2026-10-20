import { fields, record, repeatable, type Repository } from "./repository.js";

function markdown(value: unknown): string { return String(value ?? "").replace(/\|/g, "\\|").replace(/[\r\n]/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function label(value: unknown): string { return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/[<>\r\n]/g, " ").replace(/[\[\]{}]/g, " "); }
export function documentRepository(repo: Repository): string {
  const lines = ["# Content model catalogue", "", `Namespace: ${markdown(repo.manifest?.namespace)}`, `CMMF version: ${markdown(repo.manifest?.specVersion)}`, "", "## Relationships", "", "```mermaid", "flowchart LR"];
  const models = [...repo.models].sort((a, b) => String(a.data.id).localeCompare(String(b.data.id)));
  const nodes = new Map(models.map((model, index) => [String(model.data.id), `m${index}`]));
  for (const model of models) lines.push(`  ${nodes.get(String(model.data.id))}["${label(model.data.id)} (${label(model.data.kind)})"]`);
  for (const edge of repo.edges) {
    const from = nodes.get(edge.from); const to = nodes.get(edge.to);
    if (!from || !to) throw new Error(`Cannot document unresolved edge ${edge.from}.${edge.field} -> ${edge.to}.`);
    lines.push(`  ${from} ${edge.kind === "object" ? "-.->" : "-->"}|"${label([edge.field, edge.kind, edge.list ? "repeatable" : "singular", edge.ownership].filter(Boolean).join(" / "))}"| ${to}`);
  }
  lines.push("```", "");
  for (const { data } of models) {
    lines.push(`## ${markdown(data.name)} (${markdown(data.id)})`, "", `Kind: ${markdown(data.kind)}`, "", markdown(data.description), "", "| Field | Type | Required | Localised | Repeatable | Description |", "| --- | --- | --- | --- | --- | --- |");
    const defaults = record(repo.manifest?.defaults) ? repo.manifest.defaults : {};
    for (const field of fields(data)) lines.push(`| ${markdown(field.id)} | ${markdown(field.type)} | ${markdown(field.required ?? defaults.required ?? false)} | ${markdown(field.localisation ?? defaults.localisation ?? false)} | ${repeatable(field)} | ${markdown(field.description)} |`);
    lines.push("");
    for (const key of ["editorial", "governance"] as const) if (data[key]) lines.push(`${key}:`, "", "```json", JSON.stringify(data[key], null, 2), "```", "");
  }
  return `${lines.join("\n")}\n`;
}
