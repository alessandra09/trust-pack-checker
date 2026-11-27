# Sprint 2 decisions

Small decisions taken without asking the owner (SPRINT2 section 1). One line of reasoning each.

| Date       | Decision                                                                                                                                           | Why                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-11-27 | Static pages are prerendered from React after `vite build` (`scripts/prerender.tsx`, template `pages.html`) and hydrated by a small client script. | Real URLs with their own titles for search, readable without JavaScript, and strings still come from `en.json`. |
| 2026-11-27 | Privacy, terms and about are built in Task 1 with the pilot page, not in Task 5.                                                                   | They share the static page machinery; Task 5 adds SEO and content pages on top.                                 |
| 2026-11-27 | Contact details live on the About page; there is no separate contact page.                                                                         | SPRINT2 Task 5 lists privacy, terms and about only.                                                             |
| 2026-11-27 | The pilot form is a mailto builder, not Tally or Google Forms.                                                                                     | SPRINT2 section 3 decided this; no new network calls.                                                           |
| 2026-11-27 | The pilot email address is the one already on the site (not the `REPLACE_ME` default).                                                             | The owner set it in v1.1; open item 1 is answered.                                                              |
| 2026-11-27 | The mobile header already keeps the title on one line (notice sits below the header); a test now guards it at 360 px.                              | Checked by screenshot before changing anything.                                                                 |
