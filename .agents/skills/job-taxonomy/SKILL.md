---
name: job-taxonomy
description: Use when creating or changing the shared fields-to-roles catalog or its server/client validation and dropdown behavior.
---

# job-taxonomy

## Procedure
1. Create `shared/jobTaxonomy.json` with `version` and `fields`, matching format in README.
2. Include these 12 fields: construction, hospitality, healthcare, information-technology, oil-and-gas, logistics, retail, drivers-and-transport, security, engineering, administration, education.
3. Add **8–15 realistic distinct roles** to each field with stable unique kebab-case IDs and human-readable titles; provide `Other` consistently for every field.
4. Implement typed reader/validator in `shared/src/` and `GET /api/taxonomy` server route; reject duplicates, missing fields, empty labels and unmapped application role IDs.
5. Use same catalog in frontend searchable field and filtered multi-role controls. When field changes, drop old field's role selections and dependent Other text.
6. Increment taxonomy version on breaking/relabeling changes; add test fixture for new role changes and preserve stable IDs for existing records.
## Conventions
Taxonomy = occupations, not listing availability. No field names encoded in business logic. Use identifiers only for validation; display labels in UI.
## Verification
- [ ] >=12 fields and 8–15 roles each, unique IDs.
- [ ] Server rejects field-role mismatch; unknown field/role errors clear.
- [ ] Dropdown search, role selection and reset behavior tested.
- [ ] Client/API taxonomy versions agree.
