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
- Put every new tool in a named topic (COLLECTIONS in `src/config/homeSections.ts`) and, if it is a new topic, give it a hero tile, a topic page in `src/content/hubs.ts` and `hubExtras.ts`, a sitemap entry and its colours in `src/lib/homePageVariants.ts`. The catch-all "More tools" section is only a safety net and must stay empty, because topic names and addresses should not change once they are indexed.
- Any tool that saves its state in the browser (a score, a list, a log, a form) must have a visible way to start again, such as New match, New game, Clear the list or Start a new one, placed with the other main buttons and not hidden in an options box. Use `ConfirmButton` (`components/tools/shared/ConfirmButton.tsx`), which needs a second tap, instead of a browser pop-up. Disable it when there is nothing to clear.
- Keep the other rules: browser-only processing, no forged-document tools, and update README, TESTING.md and the page copy (guide steps, FAQ, article) with every change.

## Tell people what got better

Every user-visible improvement to a tool needs an entry at the top of the list in `src/config/updateEntries.ts` (date, tool route, short title, one-line benefit). It appears on `/whats-new`, as a note above the tool for 45 days and in the home page "What's new" strip. Also describe the new feature in the tool's own page copy (article, steps, FAQ), not only in the code.

## Rules that stop repeat mistakes

- Never write `new Blob([bytes as BlobPart], ...)` by hand. Use `pdfBlob(bytes)` or `bytesToBlob(bytes, type)` from `src/lib/pdf/toBlob.ts`.
- `usePersisted` reloads when its key changes, so a key must contain everything that makes the saved data different (for example the team count).
- Every page that reuses one tool component for several routes must pass `key={page.path}`.
- A text box's `onChange` must store exactly what the person typed. Cutting, trimming or rewriting the text while typing makes the cursor jump to the end, so nobody can edit in the middle. Limit with `maxLength`, and shorten or trim only where the value is used (when drawing or building the output).
- Anything that lists tool groups for people to browse (home sections, the "Explore tools" menu, new pages) must use `getListedTopics()` from `src/config/topics.ts`, never its own grouping code. Only the footer and the pre-rendered link lists use `getTopics()`, which also includes variant pages so search engines can reach them.
- A tool that gives a file to the person builds it in one function (`makePdf`, `build`) used by both Save and Share, saves with `saveBlob` (never its own copy of the create-a-link code) and shows `ShareFileButton` next to the Save button. Tools that show the shared `SaveResult` banner get Share automatically.
- New print buttons use `printAs()` from `src/lib/pdf/printName.ts`, never a bare `window.print()`.

## Pages that say something of their own

Tools that come in families (Word templates, PowerPoint makers, Excel makers, printables) share their privacy, "is it free" and "do I need Word" answers, and that is fine. But every page must also say something only it can say: the real sections, slides, columns or formulas of that tool, written from its source data (starters, section lists, sheet builders), never invented. When you add a tool to a family, add a section to its `toolArticles` entry that names what it actually produces and gives advice a reader can use. Then run `node scripts/check-page-text.mjs` after `vite build --ssr src/prerender/shellData.ts --outDir dist-ssr`; it fails when a tool page has fewer than 200 words that no other page repeats.

## When you add or change a tool: keep search and topic pages in step

Every new tool, and every change to what a tool does, must also update the places that people and Google read. Run `node scripts/check-hub-coverage.mjs` before opening the PR; it lists what is missing (it reads source files only).

1. **Search phrases**: add an entry for the tool in `src/config/searchTerms.ts` with 3 to 6 phrases people really type, in lower case (for example `'join pdf files'`). Home search ranks the tool name first, then these phrases and the tool's keywords, and uses the description only when nothing better matched, so a tool with no phrases is hard to find.
2. **Topic page task table**: add a row (task, tool id, name, one-line note) in `src/content/hubExtras.ts` for the tool's topic.
3. **Topic page text**: if the tool does something the page text does not mention, add it to the "What you can do" section in `src/content/hubs.ts`. Keep each topic's `description` at 160 characters or fewer (it is the meta description) and its `subtitle` one clear sentence. Rewrite a description that has become a long list; name the main jobs, not every tool.
4. **Common questions**: if people would search for the job ("how do I ..."), add a question to `src/content/hubFaqs.ts` before the last (privacy) one. Answers must match what the tool really does and contain no tax, salary, medical or legal facts.
5. **Home page**: if the tool opens a new area, add a hero tile with a `blurb` in `src/config/heroTiles.ts`, mention the area in the home headline text (`homeHeadingAccent`, `homeDescription` in `src/locales/en.json`) and in the home meta description (`index.html`, `src/pages/HomePage2.tsx`, `src/config/site.ts`).
6. **Names**: tool titles lead with the words people search for ("Merge PDF", "Invoice Excel Template Maker"); a "Maker" suffix suits tools that build a file, a topic name suits a section.
7. Then the usual: `src/config/updateEntries.ts`, README, TESTING.md and the results template.
