# Content kit (optional)

Three ready carousels for Instagram, TikTok (photo mode) and LinkedIn. Posting them is optional: the pilot conversations matter more.

| Folder                      | Topic                                                |
| --------------------------- | ---------------------------------------------------- |
| `carousels/article-28-dpa/` | What Article 28 requires in a DPA, in 7 slides       |
| `carousels/found-in-text/`  | Found in text: why every answer needs proof          |
| `carousels/eight-clauses/`  | Eight clauses I check first in a processor agreement |

Each folder has:

- `slide-01.png` to `slide-07.png`: light version, 1080 x 1350 (portrait, fits Instagram and TikTok).
- `dark/`: the same slides in dark colours. Use one version per post.
- `<name>.pdf`: the whole carousel as one PDF, for a LinkedIn document post.
- `caption.md`: the caption, ready to paste. It ends with "Not legal advice".
- `alt-text.md`: one description per slide. Paste each into the slide's alt text field.

## Your photo on the cover

Slide 1 has a dashed box marked "Your photo here". In Canva or any editor, put your photo over that box (it is about 40% of the slide) and export as PNG at 1080 x 1350. Nothing else needs to change.

## How to post

1. Instagram: new post, select all 7 PNGs in order, paste the caption, add alt text under Advanced settings.
2. TikTok: photo mode with the same PNGs and caption.
3. LinkedIn: new post, "Add a document", upload the PDF, give it the cover title, paste the caption.

Cadence: one carousel a week is enough. Keep the caption's first line as it is (it carries the search phrase) and do not add claims that are not on the site.

## Changing the slides

Text lives in `scripts/carousels/content.ts` (rule names come from the rules data, so they always match the site). Run `npm run carousels` to render everything again. The script stops if any text overflows a slide or a colour fails the contrast check.
