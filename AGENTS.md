# Repository guidance

Read [README.md](./README.md) for the application architecture, shared UI patterns, localization status, and privacy boundaries before making changes.

- Keep tool behavior and presentation consistent with the shared layouts, guide, and file picker; preserve accessibility and explicit error reporting.
- Keep processing logic separate from route and UI composition. Maintain catalog, search, metadata, and legal disclosures when affected.
- Store new user-facing copy in the localization resources and account for all supported languages. Localization is incomplete; do not describe it as complete without migrating and reviewing the remaining text.
- Update the architecture documentation when a change affects structure, behavior boundaries, or localization coverage.
