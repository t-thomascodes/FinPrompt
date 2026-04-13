# FinPrompt — Design Addendum

Append this to `FINPROMPT_SPEC.md` or reference it alongside. This overrides the dark theme and flat output layout from the original spec. Everything else in the original spec (API routes, data model, export logic, project structure) remains unchanged.

---

## Theme Direction: Light

The app is switching from a dark Bloomberg-terminal aesthetic to a **clean, light, professional theme**. The reasoning: this is an enterprise tool for a hedge fund, not a developer dashboard. Light themes signal "internal tool we'd actually deploy." The exports (Word, Excel, PowerPoint) are all light-background documents — the app should match.

### Updated Color Tokens

```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      fp: {
        bg: '#FAFAFA',              // page background
        surface: '#FFFFFF',          // cards, panels
        'surface-secondary': '#F5F5F7', // metric cards, data panels
        border: 'rgba(0,0,0,0.08)',  // default borders
        'border-hover': 'rgba(0,0,0,0.15)',
        'text-primary': '#1A1A1A',   // headings, key numbers
        'text-secondary': '#4A4A4A', // body text
        'text-muted': '#8A8A8A',     // labels, captions
        'text-dim': '#B0B0B0',       // placeholders, disabled

        // Category colors (same as before — these pop on light bg)
        research: '#0F6E56',         // deep green (darker for light bg)
        'research-light': '#E1F5EE', // green tint for backgrounds
        risk: '#993C1D',             // deep red-orange
        'risk-light': '#FAECE7',     // red tint for backgrounds
        operations: '#0F6E56',       // teal
        'operations-light': '#E1F5EE',
        data: '#854F0B',             // deep amber
        'data-light': '#FAEEDA',

        // Semantic
        bull: '#0F6E56',             // green — bull case borders, labels
        'bull-light': '#E1F5EE',     // green tint — bull case card bg
        bear: '#A32D2D',             // red — bear case borders, labels
        'bear-light': '#FCEBEB',     // red tint — bear case card bg
        neutral: '#534AB7',          // purple — variant perception
        'neutral-light': '#EEEDFE',  // purple tint
        warning: '#BA7517',          // amber — warnings, neutral sentiment
        'warning-light': '#FAEEDA',
      }
    }
  }
}
```

### Typography (unchanged)
- **Headings / body**: `DM Sans` via `next/font/google`
- **Data / metrics / monospace**: `JetBrains Mono` via `next/font/google`

**Critical rule**: Use DM Sans (proportional) for ALL narrative text. JetBrains Mono ONLY for: prices, percentages, metric values, ticker symbols, timestamps, code blocks. The previous version used mono for everything — that's what made it feel like a terminal dump.

### General UI Rules
- Background: `#FAFAFA` page, `#FFFFFF` cards
- Borders: `0.5px solid rgba(0,0,0,0.08)` — barely visible, just enough structure
- Border radius: `8px` for cards, `6px` for buttons and inputs, `4px` for badges
- No drop shadows except a subtle one on the main content card: `0 1px 3px rgba(0,0,0,0.04)`
- No gradients anywhere in the UI
- Buttons: white background, subtle border, category-colored text. Primary action button gets a solid category-colored background with white text.
- Inputs: white background, light border, category-colored focus ring

---

## Output Panel Redesign

This is the most important visual change. The output panel is what the user (and the Finepoint team) will spend the most time looking at. It needs to feel like a research platform, not a chat response.

### Structure (top to bottom)

#### 1. Stock header
When the workflow involves a ticker, show a prominent header:

```
[Company Name]  [TICKER badge]  [LIVE DATA badge]

$373.07  -1.26 (-0.34%)  Vol: 30.4M
```

- Company name: 22px, font-weight 500, DM Sans
- Ticker: monospace, small badge with light gray background
- LIVE DATA: small badge, green background (#E1F5EE) with dark green text (#0F6E56)
- Price: 36px, monospace, font-weight 500 — this is the biggest element on the page
- Change: colored red (negative) or green (positive), monospace, 15px
- Volume: muted gray, 12px

#### 2. Metrics grid
A 4-column grid of key stats pulled from the market data:

```
[ P/E ratio ]  [ Market cap ]  [ Beta ]  [ Analyst target ]
[   34.2    ]  [   $2.78T   ]  [ 0.89 ]  [     $420       ]
```

- Each cell: `#F5F5F7` background, 12px rounded, 12px padding
- Label: 11px, muted gray, DM Sans
- Value: 18px, monospace, font-weight 500, primary text color
- These values are parsed from the market data string — extract P/E, market cap, beta, analyst target, etc.

#### 3. 52-week range bar
A horizontal bar showing where the current price sits in the 52-week range:

```
52-week range                    $309.45 — $468.35
[===========================|·····························]
$309.45              $373.07                    $468.35
```

- Full bar: light gray background (`rgba(0,0,0,0.06)`)
- Filled portion: subtle gradient from red to amber to green (left to right)
- Current price marker: 3px wide vertical bar, primary text color
- Labels below: monospace, 11px, muted. Current price label slightly bolder.
- This communicates price context instantly without reading numbers

#### 4. Two-column data panel
Side by side:

**Left: Fundamentals**
A compact key-value grid (2 columns within the panel):
```
Revenue    $227B     EBITDA     $125B
Op margin  44.6%     ROE        39.2%
```
- Label: muted gray, 13px
- Value: monospace, primary color, 13px
- Background: `#F5F5F7`, 8px rounded

**Right: News sentiment**
A list of 4-5 headlines with colored sentiment dots:
```
● Azure AI revenue beats estimates
● Microsoft expands Copilot enterprise rollout
● EU opens new antitrust probe into cloud bundling
● Gaming segment shows post-Activision growth
```
- Dot colors: green (#5DCAA5) for bullish, amber (#EF9F27) for neutral, red (#E24B4A) for bearish
- Headline text: 12px, secondary color, truncated with ellipsis if too long
- Background: `#F5F5F7`, 8px rounded

#### 5. Analysis sections (the actual output)
This is where Claude's response is rendered. Each major section gets its own visually distinct block.

**Section header**: `font-size: 18px; font-weight: 500; color: primary` — "Investment memo" or the workflow title

**Bull case block:**
- Left border: 3px solid green (#5DCAA5)
- NO border-radius (left border only — radius looks wrong on single-sided borders)
- Padding-left: 20px
- Section label: 14px, green (#0F6E56), font-weight 500, "Bull case"
- Each numbered point:
  - Title: 14px, font-weight 500, primary text color — "1. Cloud growth acceleration"
  - Description: 13px, secondary text color, line-height 1.6
  - Spacing: 16px between points

**Bear case block:**
- Same layout but with red (#E24B4A) left border
- Section label in red (#A32D2D)

**Key metrics to monitor:**
- Left border: 3px solid light gray (border-secondary)
- Content rendered as a 2x2 grid of small cards
- Each card: `#F5F5F7` background, rounded, 10-12px padding
  - Metric name: 13px, font-weight 500, primary
  - Context note: 12px, muted gray

**Variant perception:**
- Left border: 3px solid purple (#AFA9EC)
- Section label in purple (#534AB7)
- Body: 13px, secondary color, line-height 1.7 (this section is usually a single paragraph)

#### 6. Export bar
Pinned at the bottom of the output, separated by a thin border-top:

```
[ Word ]  [ Excel ]  [ PowerPoint ]  [ Copy ]
```

- Standard button styling (white bg, subtle border, 12px text)
- On hover: slight background fill
- These trigger the `/api/export/*` routes from the main spec
- Also show on the log detail view, not just the live output

---

## Sidebar & Navigation (Light Theme Adjustments)

### Sidebar
- Background: white (`#FFFFFF`)
- Border-right: `0.5px solid rgba(0,0,0,0.08)`
- Active category: category-colored left border (2px), light tint background (e.g., `#E1F5EE` for research), category-colored text
- Inactive category: muted gray text, transparent background
- Workflow template cards: white background, subtle border on selected, no border on unselected
- LIVE badge: small, green background (#E1F5EE), dark green text (#0F6E56)
- Run count next to each category: monospace, muted, small

### Header
- Background: white
- Border-bottom: `0.5px solid rgba(0,0,0,0.08)`
- Logo "F" box: solid green (#0F6E56) background, white text
- Tab navigation: selected tab gets subtle background fill, bolder text. Unselected is muted.
- Settings gear: muted when no API key, green when connected
- Status dot: green when API connected, amber when not

### Settings panel
- Slides down below header, light gray background (`#F5F5F7`)
- API key input: white background, standard focus ring
- Descriptive text in muted gray

---

## Analytics Dashboard (Light Theme)

### Stat cards
- Background: `#F5F5F7`
- Label: 11px, muted, uppercase
- Value: 24px, monospace, font-weight 500, category-colored (green for total runs, amber for avg rating, teal for data-enriched, red for workflow count)
- Sub-label: 11px, muted

### Category breakdown
- Each row: white background, subtle border, 8px rounded
- Category icon + label on left
- Run count in category color (monospace, bold)
- Average rating in amber
- Usage bar: thin (4px), category-colored fill on light gray track

### Top workflows leaderboard
- Numbered list (#1, #2, etc.) in green monospace
- Workflow name in secondary text
- Run count and avg rating on right side

---

## Log Views (Light Theme)

### Log list
- Each log entry: white card, subtle border, 8px rounded
- Hover: border darkens slightly
- Title: 13px, font-weight 600, primary
- LIVE badge: same green style
- Metadata (timestamp, inputs): monospace, 10px, muted
- Star rating: filled stars in amber (#EF9F27), unfilled in light gray
- Output preview: 11px, muted, truncated to 2 lines

### Log detail
- Back button: subtle, muted
- Same stock header + metrics grid + output layout as the live output panel
- Star rating: larger (20px stars), interactive
- Market data collapsible section
- Export bar at the bottom

---

## Workflow Config Area (Light Theme)

### Variable inputs
- White background, light border
- Focus ring in category color
- Label: 11px, uppercase, muted, letter-spacing
- Placeholder: dim gray

### Execute button
- Solid category-colored background, white text, font-weight 700
- Disabled state: light gray background, dim text
- Loading state: "Fetching data..." or "Running..." with subtle pulse animation

### Edit mode
- Textarea: white background, light border, monospace text
- Save / Fork / Cancel buttons: Save in category color, Fork in muted, Cancel in transparent

---

## Output Parsing Rules

The output parser needs to handle Claude's markdown and map it to the visual components described above. The parser should identify:

1. **The overall structure** — look for `### Bull Case`, `### Bear Case`, `### Key Metrics`, `### Variant Perception` (or similar patterns with `1.`, `2.` numbered headers)

2. **Section type detection:**
   - If section title contains "bull" (case insensitive) → green-bordered block
   - If section title contains "bear" → red-bordered block
   - If section title contains "metric" or "monitor" → gray-bordered, 2x2 card grid
   - If section title contains "variant" or "perception" or "divergence" → purple-bordered block
   - If section title contains "consensus" or "expectation" → neutral gray block
   - If section title contains "surprise" or "scenario" → amber-bordered block
   - Default: gray-bordered block

3. **Within sections:**
   - `1. **Title**` or `1. Title` → numbered point with bold title
   - `▸ text` or `- text` → sub-bullet, indented, muted
   - `**Label:** text` → bold label followed by regular text
   - Regular text → paragraph

4. **For non-research outputs** (investor letters, automation specs, SQL queries):
   - Don't apply bull/bear coloring
   - Use neutral gray left borders for all sections
   - Code blocks (triple backtick) → monospace, `#F5F5F7` background, 8px rounded, 16px padding
   - Tables → actual HTML tables with header row, alternating row tint

---

## File Naming for Exports

```
finprompt_[workflow-slug]_[primary-input]_[YYYY-MM-DD].[ext]
```

Examples:
- `finprompt_bull-bear_NVDA_2026-04-10.docx`
- `finprompt_earnings-prep_AAPL_2026-04-10.xlsx`
- `finprompt_risk-assessment_TSLA_2026-04-10.pptx`

---

## Summary of What Changed from Original Spec

| Area | Original | Updated |
|------|----------|---------|
| Theme | Dark (#0A0E17 backgrounds) | Light (#FAFAFA / #FFFFFF) |
| Output layout | Flat monospace text dump | Structured: stock header → metrics grid → 52-week bar → data panels → color-coded sections |
| Typography | JetBrains Mono everywhere | DM Sans for prose, JetBrains Mono for data only |
| Bull/bear | No visual distinction | Green left-border vs red left-border |
| Market data | Raw text preview | Parsed into metrics grid + sentiment list |
| Key metrics | Bullet list | 2x2 card grid |
| Section colors | All same | Green (bull), red (bear), purple (variant), amber (surprise), gray (default) |
| Export bar | Bottom of page, text links | Clean button row, subtle, always visible |
| Borders | 1px solid hard colors | 0.5px solid rgba, barely visible |
| Shadows | None | Minimal (1px 3px 0.04 alpha on main card only) |
