# Repository guidance

Read [README.md](./README.md) for the application architecture, shared UI patterns, localization status, and privacy boundaries before making changes.

- Keep tool behavior and presentation consistent with the shared layouts, guide, and file picker; preserve accessibility and explicit error reporting.
- Keep processing logic separate from route and UI composition. Maintain catalog, search, metadata, and legal disclosures when affected.
- Store new user-facing copy in the localization resources and account for all supported languages. Localization is incomplete; do not describe it as complete without migrating and reviewing the remaining text.
- Update the architecture documentation when a change affects structure, behavior boundaries, or localization coverage.

## Product principle: the everyday tool, one level better

MyDailyUtils started with one aim: build the ordinary utilities that already exist all over the internet, but make each one a level better and give people a little extra compared with what other sites offer. Apply this to every new tool and every change, and when reading test results from the owner or from other reviewers.

- Start from what the common version of the tool does, then decide what makes this one better. Improve one or more of: **usability** (fewer steps, better defaults, works well on a phone, clear errors), **information** (explain the result, show the working, add the context people usually have to look up elsewhere), and **capability** (handle the cases other tools get wrong or ignore, such as extra payments, other currencies, edge dates, limits and eligibility rules).
- Decide the "little extra" per tool, not by a template. Examples already in the product: the EMI calculator's month-wise table, extra payments and ways to pay less interest; the time zone converter's draggable day strips with date changes; the rent receipt's PAN reminder for HRA; the price tag maker's barcodes.
- Where a tool has rules or eligibility (tax limits, HRA, file size limits, what a lender allows), show them and flag when the input crosses one, with a plain caution that the result is an estimate.
- When test findings come back, treat them as a prompt to ask whether the tool is also missing its "extra", not only whether it is broken, and say what could be better.
- Keep the other rules: browser-only processing, no forged-document tools, and update README, TESTING.md and the page copy (guide steps, FAQ, article) with every change.
