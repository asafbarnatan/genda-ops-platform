# DESIGN.md — Buildots brand system (extracted from provided assets)

> Source of truth for the platform (Layer 2) and the deck (Layer 3). Extracted from Asaf's provided assets: the 6-page assignment PDF, real Buildots product screenshots (Issues table, Create-Punch modal, image-compare, Delay-Forecast card), and the hi-res logo. Two systems live here: **A. Product UI** drives the platform; **B. Marketing** drives the deck. Follows the gstack design-consultation convention (tokens → components → QA against reference).

## Brand essence
The one memorable thing: a **bracketed `[ ]` frame with a single lime `+`** — a registration mark / "capture" motif. Precise, technical, construction-grade. Clean neo-grotesque type, generous white space, charcoal + one warm accent, one lime spark.

---

## A. PRODUCT UI SYSTEM (the platform)

### Color tokens
```
--bd-bg:          #F4F5F6;  /* app background (light gray) */
--bd-surface:     #FFFFFF;  /* cards, nav, tables */
--bd-surface-alt: #FAFAFB;  /* table header, subtle fills */
--bd-border:      #E6E7E9;  /* hairlines, dividers */
--bd-border-strong:#D6D7DA;
--bd-ink:         #20201E;  /* primary text / charcoal (logo) */
--bd-ink-2:       #6B6C6E;  /* secondary text */
--bd-ink-3:       #9A9B9D;  /* muted / placeholder */

--bd-amber:       #E6B23C;  /* PRIMARY action + active nav + buttons (text on it = ink) */
--bd-amber-ink:   #20201E;
--bd-lime:        #DDF250;  /* brand spark: logo "+", small accents only */

/* data-viz (from Delay-Forecast card) */
--bd-viz-actual:  #D4E64C;  /* lime */
--bd-viz-plan:    #C7C9CC;  /* gray (schedule) */
--bd-viz-forecast:#8B7FE8;  /* lavender/purple */
--bd-viz-delay:   #E9AEC8;  /* pink (hatch) */

/* status / RAG — plain-language On track / At risk / Critical */
--bd-green: #3FB37F;  --bd-green-bg:#E9F6F0;
--bd-amber-s:#E8973F; --bd-amber-bg:#FBF0E2;
--bd-red:   #E5533D;  --bd-red-bg:  #FBE9E6;

/* provenance */
--bd-provided:#2F6DB5;  --bd-provided-bg:#E9F0F9;   /* 🟦 */
--bd-fictive: #C77D16;  --bd-fictive-bg:#FBF1E1;    /* 🟧 */
```

### Typography
- Family: **Inter** (web-safe match for Buildots' neo-grotesque). Weights 400/500/600/700/800.
- The wordmark is a **custom condensed bold** → use the **logo as an SVG asset**, never as a font.
- Scale: page title 26/700; section title 18/700; card title 15/600; body 14/400; label 11/600 UPPERCASE +0.08em tracking (the letter-spaced micro-labels); numbers/metrics 28-34/700 tabular.

### Shape & depth
- Radius: cards 8px, buttons 6px, pills 14px, inputs 6px.
- Shadow: `0 1px 3px rgba(0,0,0,.08)` (cards), `0 8px 30px rgba(0,0,0,.18)` (modals).
- Borders: 1px `--bd-border`. Row separators `#EFEFEF`.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48.

### Component patterns (match the screenshots exactly)
- **Top nav:** white, ~64px, hairline bottom border. Left: bracketed `[BUILDOTS +]` logo (charcoal wordmark, lime plus). Center-left: horizontal text tabs; **active tab = charcoal bold + 2px amber underline**, inactive = `--bd-ink-2`. Right cluster: building/project selector ("Genda Ops"), help "?" circle, amber circular avatar.
- **Page header:** page title (26/700) + optional right-aligned primary button.
- **Toolbar row:** search input (rounded, border, magnifier), dropdown filters ("All … ▾"), "+ Add filter" text button; right: a **segmented toggle** where the active segment is **amber fill + charcoal text**; icon view-toggles (active = amber).
- **Table:** light header row (`--bd-surface-alt`) with 11px uppercase-ish column labels, checkbox column, roomy rows (~52px), hairline separators, hover `#FBFBFB`, right-aligned row action icons; footer: left count ("14 projects"), right "Rows per page ▾ · 1 of N · ‹ ›".
- **Button:** primary = amber fill, charcoal text, 6px radius, 600; secondary = white + border; text button = ink-2.
- **Modal:** centered white card (radius 8, modal shadow) over `rgba(20,20,20,.45)` overlay; title + X; labeled fields in a 2-col grid; footer "Cancel" (text) + primary amber button.
- **Pill/badge:** 14px radius, 11px/600; status pills use the RAG bg/fg pairs; provenance chips use provided/fictive pairs.
- **Card/tile:** white, radius 8, subtle shadow, 16-24 padding; metric tiles show a letter-spaced label + a big number + a small status line (mirrors the Delay-Forecast pace cards, which use a colored left-accent bar).

---

## B. MARKETING SYSTEM (the deck — Step 3)
- **Title slides:** dark gradient `#1E1E1C → #2A2C22`; big white grotesque title (48-64/800); gray subtitle; **lime `+` top-right + lime beacon-grid** line graphic; bracketed letter-spaced section label top-left; dark category chips (border `#3A3A38`); bottom stat blocks = thin top rule + letter-spaced gray micro-label + white value.
- **Content slides:** light bg with pale-lime glow top-right; charcoal titles; dark section-label pill (letter-spaced white); logo top-right; faint `+` grid watermark; white cards (radius 10, subtle shadow) with **indigo `#5B4FE9`** badges (Who/What/When, numbers) + **lime `#DDF250`** "Done/success" + colored **left-border accents**; bottom callout bar (tinted rounded + colored pill label).
- **Accents:** indigo `#5B4FE9` primary; lime `#DDF250` highlight; ink `#20201E`; body `#6B6C6E`.
- **Motifs (reuse across both systems):** the `+` plus; corner-bracket framing; letter-spaced uppercase micro-labels; the lime beacon-grid.

---

## QA / fidelity loop (design-review + browse)
Build → run dev → screenshot each screen → compare against the real Buildots screenshots + these tokens → atomic fixes until faithful. Higher-severity if a value deviates from a token above. Nav, table, modal, and the amber-active pattern are the signatures to get pixel-right.
