# DESIGN2: Visual and UX pass for Trust Pack Checker

Written 28 Nov 2026. Scope: look, feel and clarity only. No new features, no changes to rules, results logic or legal copy. Keep every disclaimer. `npm run verify` green, branch `s3-design`, merge after CI, deploy only after the owner says yes.

## 1. Goal

A senior compliance or consulting person opens the page and, within 5 seconds, thinks: calm, precise, trustworthy. Then they feel a small aesthetic pleasure. Aesthetic quality raises perceived credibility (aesthetic-usability effect), and easy-to-read pages feel more true (processing fluency). So: fewer things, better ordered, with more space.

## 2. Principles (durable, not trend-dependent)

1. One idea per screen. One primary action per screen (Hick's law). Everything else is visibly secondary.
2. Clear visual hierarchy: headline, proof, action. Three levels of type size, not seven.
3. Whitespace is a feature. Generous spacing, short line length (60 to 72 characters), no dense blocks.
4. Show the mechanism, not adjectives: the quote card is the hero visual.
5. Restraint: one accent colour, used only for action and for "verified". Status colours only for status, always with a label or icon (never colour alone).
6. Human signal near the top: the owner's name and role.
7. Motion is subtle and meaningful (a 150 to 250 ms fade or slide on reveal, a quote highlight sweep when a result appears). Respect `prefers-reduced-motion`.
8. Accessibility is part of beauty: contrast AA minimum, visible focus, 44 px touch targets, axe clean.

## 3. Direction for 2027 to 2029 (an informed extrapolation, not a fact)

Trends point toward calm, editorial, tactile interfaces rather than loud gradients: quiet minimalism, large confident typography, soft layered surfaces, one restrained accent, subtle depth, small meaningful animations, and a "document" feel for professional tools. Avoid what is already overused: heavy glassmorphism, neon gradients, floating 3D blobs, auto-playing effects. Do not chase gimmicks; this audience reads for judgement and rigour.

Implementation choices (decided, do not re-ask):

- Typeface: a refined serif for headlines (for example Source Serif 4 or Fraunces) plus a clean sans for UI and body (for example Inter or Instrument Sans). Self-host open-licence font files in `public/fonts` (woff2, subset to Latin plus Latin Extended, `font-display: swap`). No external font requests. You may add the font files; no other new dependency without asking.
- Themes: ship a light theme as default ("paper": warm off-white background, near-black text, one deep accent such as ink blue or deep teal) and keep the dark theme as an option following `prefers-color-scheme` with a manual toggle. Both from the same design tokens in one file (`src/styles/tokens.css`): colour, spacing scale (4 px base), radius, shadow, type scale, motion durations.
- Surfaces: flat paper with 1 px hairline borders and very soft shadows; evidence/quote card gets a slightly raised "document" look with a thin accent rule on the left and the highlighted quote like a marker stroke.
- Layout: max content width 1080 px; hero text column about 640 px; 8 px grid; consistent section rhythm (96 px desktop, 64 px mobile between sections).
- Icons: one consistent line-icon set, inline SVG, 1.5 px stroke.
- Microcopy tone: plain, confident, no hype.

## 4. Page structure (landing page, in this order)

1. Header: product name left, small links right (How it was tested, Sample report), theme toggle. Remove the "Best on a desktop screen" banner from the top; show it only inside the tool screens on narrow widths.
2. Hero: serif headline "Every answer comes with its proof." Under it one sentence of value. Under that one primary button "Try with sample data" and one text link "Request a free pilot review". Under that a quiet line: "Built by Oleksandra Hordieieva, who leads GDPR compliance at a 35-person telecom company." (link to LinkedIn). On desktop, the quote-card demo sits to the right of the hero; on mobile directly below.
3. Proof strip: three small facts in a row, from data files: "Runs in your browser", "20 Art. 28 checks", "Quotes checked word for word".
4. How it works in three steps (icons, one line each).
5. Two use cases as two calm cards (questionnaire, vendor review), each with a secondary button.
6. Measured, not promised: first the one-line summary, then the collapsed details. Keep the honest numbers and the N. Add one sentence of context beside the weaker number (what is still being improved) without hiding it.
7. Free pilot and consultants block merged into one section with a single primary button. Sample report link beside it.
8. Footer: disclaimers, how it was tested, privacy, terms, about.
   Keep all current legal text and the "synthetic" labels.

## 5. Tool screens (upload, results)

- Result rows: status chip with icon plus text, quote shown as a small "document excerpt" with highlighted words and page, expandable details.
- Empty and loading states designed, not default: short friendly text, skeleton placeholders, a progress indicator with real step names.
- Errors: plain language, what happened, what to do next.
- Keep keyboard flow and focus order exactly as now.

## 6. Acceptance

- Visual regression screenshots at 360, 390, 768, 1280 and 1600 px for light and dark, saved in `docs/design/`, no horizontal scroll, no text clipping.
- Lighthouse mobile: performance at least 95, accessibility 100, SEO 100 (no regression); CLS under 0.05; total font payload under 150 KB.
- Contrast AA for all text and for status chips in both themes (automated check).
- axe clean; `prefers-reduced-motion` honoured (test).
- Only one primary button per viewport on the landing page (test counts elements with the primary class).
- Existing tests still pass; no copy changed except where this file says so.

## 7. Final report to the owner

Short. Before and after screenshots (light and dark, mobile and desktop), the Lighthouse numbers, and anything you were unsure about. No code in the message.
