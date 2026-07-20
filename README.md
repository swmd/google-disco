# GenTabs — Prompt-driven Generative UI

> Type a prompt, watch an interface **assemble itself**. A front-end prototype
> inspired by the Google Disco / GenTabs concept: natural-language prompts are
> parsed **deterministically** into a layout schema and rendered on the fly with
> FLIP morphing, staggered generation states, and a cinematic map camera.

**No LLM required** — the intelligence on display is the prompt → layout mapping
engine and the motion choreography. The architecture is deliberately shaped so a
live LLM streaming JSON could replace the parser without touching the renderer.

🚀 **Live demo:**
`https://google-disco.netlify.app`

📄 **Full design & technical write-up:** [`docs/DESIGN.md`](docs/DESIGN.md)
— user-flow diagrams, prompt→UI mapping architecture, and motion strategy.

💻 **Source:** [github.com/swmd/google-disco](https://github.com/swmd/google-disco)

---

## ✨ Highlights

- **Prompt → layout schema → animated render.** A pure, testable intent parser
  compiles text into a normalized `Scene` descriptor; the renderer only knows the
  schema.
- **The Transition & The Morph.** `flight New York → London` builds a routed map +
  detail rail; a follow-up `hotel in London` **morphs** the same rail into a hotel
  card (shared `layoutId`) while the camera zooms — no unmount, no flash.
- **Explicit generation states.** `idle → parsing → generating → ready` with
  skeleton/shimmer and staggered, blur-to-sharp reveals.
- **Design-system driven.** Tokenized type scale, 8pt spacing, semantic color with
  full **light/dark** theming.
- **Accessible & responsive.** Semantic HTML, ARIA live status, keyboard focus,
  skip link, and full `prefers-reduced-motion` support; mobile → desktop layouts.

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
npm test           # unit-test the prompt → Scene engine (no browser needed)
```

## 🕹️ Try these prompts

| Prompt | What happens |
|---|---|
| `Show my flight route from New York to London` | Prompt bar docks, map springs up, SVG route draws, flight rail staggers in |
| `Show me my hotel details for London` | **Morph** — rail reshapes into a hotel card, camera zooms to London |
| `What's the weather in Tokyo` | Camera flies to Tokyo, forecast panel |
| `Things to do in Paris` | POI markers fan out + curated list |
| `Flight from San Francisco to Sydney` | Trans-Pacific route |
| `London` (bare) / gibberish | Graceful fallbacks |

> Tip: run the two top prompts back-to-back to see **The Morph**. The example
> chips under the prompt bar are the fastest way to demo it.

## 🧱 Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Framer Motion** — `layout`/`layoutId` FLIP, springs, `useReducedMotion`
- **Tailwind CSS** — design tokens via CSS variables

## 🗂️ Architecture at a glance

```
app/          root shell + orchestrator page
components/   Workspace, panels/ (MapStage, DetailPanel), system/ (PromptBar…)
              registry.tsx — intent → presentation metadata (extension point)
lib/intent/   parser · gazetteer · builders · types  (prompt → Scene schema)
lib/motion/   spring/easing profiles + shared variants
lib/useGenerationMachine.ts   generation lifecycle state machine
docs/DESIGN.md  full technical document
scripts/test-parser.ts  headless engine tests
```

Detailed component architecture, modular state handling, naming conventions, and
future-scalability notes live in [`docs/DESIGN.md`](docs/DESIGN.md).


## ☁️ Deployment

Deployed on **Netlify** from `main`. Configuration lives in
[`netlify.toml`](netlify.toml) rather than the dashboard, so the deploy is
reproducible from the repo alone:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | `22` (pinned; also in [`.nvmrc`](.nvmrc)) |
| Plugin | `@netlify/plugin-nextjs` |

Every route prerenders as static (`○ Static`) — there is no SSR, no API route and
no database, so the deployment is a CDN-served build with no runtime dependency.

```bash
npm run typecheck && npm test && npm run build   # what CI/Netlify effectively runs
```


## 📌 Scope notes

- Data is mock and **deterministic** (derived from stable place ids), so a given
  prompt always yields the same layout.
- The stylized world map is abstract by design (self-contained, no map-tile
  dependency) and shares the gazetteer's equirectangular projection so markers
  land on the right landmasses.