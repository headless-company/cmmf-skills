---
name: cmmf-document
description: Generate stakeholder-readable CMMF model catalogues, field dictionaries, and Mermaid relationship diagrams from model files. Use to explain or document a content architecture; not to make diagrams the authoritative model.
---

Produce useful generated views of the actual CMMF source.

Read [source-resolution](references/source-resolution.md) and [local-tools](references/local-tools.md). Resolve the repository version and validate the model graph. Do not draw a complete-looking diagram from an incomplete or invalid graph without clearly explaining its omissions.

Use the document helper for a catalogue and relationship diagram. Save the output to the user's requested location through the host's file editor. Retain IDs, model kinds, embedding versus references, repeatability, ownership, and rich-text reference embeds. For large repositories use relevant bounded views and make omitted scope explicit.

Adapt the explanation for the audience. Explain why significant structures exist using supplied requirements or recorded decisions, labelling inference. Add task-relevant descriptions of validations, enum values, localisation, rich-text capabilities, and editorial/governance metadata from the actual files; the generated overview table is not exhaustive.

Include source version/revision and generation/validation evidence. Keep docs as derived views; do not rewrite model YAML to make a diagram look simpler. When changes are requested, regenerate affected documentation from the updated model.

Example: “Explain the article architecture to our content team.” Generate a catalogue and diagram showing authors as linked identities and SEO as embedded structure, then explain the editing consequences in plain language.
