[🇺🇦 Русский](./README.md) | 🇬🇧 English

# node-esbuilder

A modern project builder for classic markup based on the BEM methodology.

A replacement for the outdated Gulp stack. No React, Vue, or other frameworks — just plain HTML, SCSS, and vanilla JS.

---

## Stack

| Tool               | Version | Purpose                                            |
| ------------------ | ------- | -------------------------------------------------- |
| Dart Sass (`sass`) | ^1.98.0 | SCSS → CSS compilation                             |
| PostCSS            | ^8.5.6  | Autoprefixer, media-query sorting, inline SVG      |
| esbuild            | ^0.28.1 | Bundles JS into a single file (IIFE), minification |
| browser-sync       | ^3.0.4  | Dev server with live-reload                        |
| chokidar           | ^5.0.0  | File-change watching                               |
| sharp              | ^0.35.3 | Image optimization and conversion (WebP, AVIF)     |

## Quick Start

```bash
# Clone
git clone https://github.com/des-yogi/node-esbuilder.git my-project
cd my-project

# Install dependencies
npm i

# Start the dev server (build + browser-sync + watchers)
npm run dev [npm start]

# Production build
npm run build
```

## Dev Server

* When you run `npm run dev`, pages are available both via the full path
  (`http://localhost:3000/events.html`) and without the extension
  (`http://localhost:3000/events`) — the server automatically appends
  `.html` if such a file exists in `build/`.

* When style files (`.scss`) change, the browser updates the CSS on the fly, without a full page reload — form state, scroll position, and open modals/accordions are preserved. A full reload only happens when HTML, JS, or the block structure (`projectConfig.json`) changes.

## Commands

| Command                               | What it does                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`                         | Dev server: build + browser-sync + watchers                                          |
| `npm start`                           | Alias for `npm run dev`                                                              |
| `npm run build`                       | Production build (minification, no sourcemaps)                                       |
| `npm run deploy`                      | Production build + publish `build/` to the `docs/` folder on `master` (GitHub Pages) |
| `npm run undeploy`                    | Remove `docs/` from the `master` branch                                              |
| `npm run create-block -- block-name`  | Create a new BEM block                                                               |
| `npm run remove-block -- block-name`  | Remove a block: cleans up `projectConfig.json` and deletes the block's folder        |
| `npm run purge-unused`                | Lists unregistered blocks in `src/blocks` (dry run, deletes nothing!)                |
| `npm run purge-unused -- --apply`     | Deletes (!) all unregistered blocks — for cleaning up the template before archiving  |
| `npm run gen:style`                   | Regenerate `style.scss`                                                              |
| `npm run img:opt -- <input> <output>` | Image optimization + conversion to WebP/AVIF                                         |
| `npm run lint:css`                    | Check SCSS with stylelint                                                            |
| `npm run lint:js`                     | Check JS with eslint                                                                 |
| `npm run lint`                        | Check both JS and SCSS                                                               |
| `npm run lint:fix`                    | Auto-fix lint errors                                                                 |

> **Linting is not part of `npm run build` or `npm run dev`.** Style and script checks run separately — a deliberate choice so the build doesn't fail because of stylistic issues in the template's library blocks.

## Project Structure

```
project/
├── build/                     # Build output (generated)
│   ├── css/
│   │   ├── style.min.css      # Main style bundle
│   │   └── bootstrap.min.css  # copiedCss
│   ├── js/
│   │   ├── script.min.js      # Main JS bundle
│   │   └── bootstrap.bundle.min.js  # copiedJs
│   ├── img/
│   ├── fonts/
│   ├── video/
│   └── index.html
│
├── design/                    # Working folder (NOT in git)
│
├── src/                       # Source files
│   ├── _include/              # HTML fragments for @@include
│   ├── blocks/                # BEM blocks
│   │   ├── page/
│   │   │   ├── page.html
│   │   │   ├── page.scss
│   │   │   ├── page.js        # (optional)
│   │   │   └── img/           # Block images → build/img/
│   │   └── ...
│   ├── css/                   # Ready-made CSS for copiedCss
│   ├── fonts/                 # Fonts → build/fonts/
│   ├── img/                   # Global images → build/img/
│   ├── video/                 # Video → build/video/
│   ├── js/
│   │   ├── index.js           # Entry point (global scripts)
│   │   └── libs/               # Ready-made JS for copiedJs
│   ├── scss/
│   │   ├── variables.scss
│   │   ├── mixins.scss
│   │   ├── print.scss
│   │   └── style.scss         # Generated automatically!
│   └── index.html             # Main page
│
├── scripts/                   # Builder scripts
│   ├── build.mjs              # Build orchestrator
│   ├── dev-server.mjs         # Dev server + watchers
│   ├── config.mjs             # Reads projectConfig.json
│   ├── clean.mjs              # Cleans build/
│   ├── generateStyle.mjs      # Generates style.scss
│   ├── styles.mjs             # Compiles SCSS → CSS
│   ├── scripts.mjs            # Bundles JS via esbuild
│   ├── assets.mjs             # Copies fonts, images, video
│   ├── html.mjs               # Builds HTML (@@include)
│   ├── sprite-svg.mjs         # Builds SVG sprite
│   ├── img-opt.mjs            # Optimizes + converts images
│   ├── deploy.mjs             # Deploy/remove docs/ on master (GitHub Pages)
│   └── logger.mjs             # Colored console output
│
├── projectConfig.json         # Main project config
├── customPostcss.js           # Custom PostCSS plugins
├── createBlock.mjs            # Block creation utility
├── removeBlock.mjs            # Block removal utility
├── purgeUnused.mjs            # Find/remove unused blocks (archiving)
└── package.json
```

## projectConfig.json

The central configuration file. Controls which blocks, styles, and scripts are included in the build.

```json
{
  "dirs": {
    "srcPath": "src/",
    "buildPath": "build/",
    "blocksDirName": "blocks"
  },

  "blocks": {
    "page": [],
    "header": [],
    "footer": []
  },

  "addCssBefore": [
    "src/scss/variables.scss",
    "src/scss/mixins.scss"
  ],
  "addCssAfter": [
    "src/scss/print.scss"
  ],

  "addJsBefore": [],
  "addJsAfter": [],

  "copiedJs": [
    "src/js/libs/bootstrap.bundle.min.js"
  ],
  "copiedCss": [
    "src/css/bootstrap.min.css"
  ],

  "singleCompiled": [],

  "allowedImageExtensions": [
    "jpg", "jpeg", "png", "gif", "svg", "ico", "webp", "avif"
  ],
  "allowedVideoExtensions": [
    "mp4", "webm", "ogv"
  ]
}
```

### Field Descriptions

| Field                    | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| `blocks`                 | An object: key = block name, value = `[]`. Key order = order in the CSS |
| `addCssBefore`           | SCSS files included BEFORE the blocks in `style.scss`                   |
| `addCssAfter`            | SCSS files included AFTER the blocks                                    |
| `addJsBefore`            | JS files included BEFORE the blocks in the bundle                       |
| `addJsAfter`             | JS files included AFTER the blocks                                      |
| `copiedJs`               | JS files copied to `build/js/` without bundling                         |
| `copiedCss`              | CSS files copied to `build/css/` without processing                     |
| `singleCompiled`         | SCSS files compiled separately (not into the main bundle)               |
| `allowedImageExtensions` | Whitelist of image extensions to copy                                   |
| `allowedVideoExtensions` | Whitelist of video extensions to copy                                   |

## BEM Naming

The project uses the BEM methodology:

- **Block:** `block-name`
- **Element:** `block-name__element`
- **Modifier:** `block-name block-name--modifier`

### Creating a Block

```bash
npm run create-block -- my-block [js] 
```

The `js` argument is optional — without it, the block is created without a JS file by default.

Creates:

```
src/blocks/my-block/
├── my-block.html
├── my-block.scss
├── my-block.js
├── bg-img/
└── img/
```

And automatically registers the block in `projectConfig.json`.

### Removing a Block

```bash
npm run remove-block -- my-block
```

Deletes the `src/blocks/my-block/` folder and removes the block from `projectConfig.json`.
If the block is already missing from the config or from disk, the corresponding step is simply skipped — no error is raised.

> If a block was deleted manually (without this command), the next build will have `style.scss` referencing a file that no longer exists, and the styles build will fail with the Sass error `Can't find stylesheet to import`. Use `npm run remove-block` instead of deleting the folder by hand!

### Cleaning Up Unused Blocks (Archiving)

The starter template ships with library blocks that a given project may not need. Before archiving a project, you can find and remove them:

```bash
# Show a list of unregistered blocks (deletes nothing)
npm run purge-unused

# Actually delete the found folders
npm run purge-unused -- --apply
```

The criterion for "unused" is: a folder exists in `src/blocks/`, but its name isn't among the keys of `projectConfig.json → blocks`. `projectConfig.json` itself is not modified — if a block was never registered, there's nothing to clean up in the config.

> A dry run is always performed by default. Actual deletion only happens with the explicit `--apply` flag, since this is an irreversible bulk operation.

## Adding Third-Party Libraries

### JavaScript

**Method 1 — via import in code (recommended):**

```bash
npm i swiper
```

```js
// src/blocks/slider/slider.js
import Swiper from 'swiper';

var slider = new Swiper('.slider', { slidesPerView: 1 });
```

esbuild will automatically pull the package from `node_modules` and include it in the bundle. Works with ESM, CommonJS, and UMD — the format doesn't matter.

**Method 2 — via projectConfig.json (classic):**

```json
"addJsBefore": [
  "./node_modules/swiper/swiper-bundle.min.js"
]
```

The file will be included in the overall `script.min.js` bundle. Files of any format are supported (ESM, CJS, UMD).

**Method 3 — copy without bundling:**

```json
"copiedJs": [
  "src/js/libs/bootstrap.bundle.min.js"
]
```

The file is copied to `build/js/` as-is. Include it in HTML with a separate `<script>` tag.

### CSS / SCSS

**Method 1 — via @use in SCSS (recommended):**

```scss
// src/scss/variables.scss
@use 'bootstrap/scss/functions' as *;
@use 'bootstrap/scss/variables' as bs-vars;

$primary: #FF6600;
```

```scss
// src/blocks/modal/modal.scss
@use '../../scss/variables' as *;
@use 'bootstrap/scss/mixins' as bs;

.modal {
  @include bs.media-breakpoint-up(md) {
    padding: 32px;
  }
}
```

Dart Sass resolves packages in `node_modules` automatically.

**Method 2 — via projectConfig.json (classic):**

```json
"addCssBefore": [
  "node_modules/bootstrap/scss/_functions.scss",
  "node_modules/bootstrap/scss/_variables.scss",
  "src/scss/variables.scss",
  "src/scss/mixins.scss"
]
```

The files are included via `@use` in the generated `style.scss`.

**Method 3 — copy a ready-made CSS file:**

```json
"copiedCss": [
  "src/css/bootstrap.min.css"
]
```

The file is copied to `build/css/` as-is.

> **Both approaches (1 and 2) can be combined** in a single project. You can migrate to `import`/`@use` gradually.

## Image Optimization

A standalone utility for optimizing and converting images to modern formats:

```bash
# From the design folder back into the design folder (conversion without touching src)
npm run img:opt -- design/originals design/optimized

# From design directly into src
npm run img:opt -- design/photos src/img

# Images for a specific block
npm run img:opt -- design/hero src/blocks/hero/img
```

**For every JPG/PNG, it:**

- Creates an optimized original (mozjpeg / PNG effort:8)
- Creates a `.webp` version
- Creates a `.avif` version
- SVG, ICO, GIF — copied unchanged

The nested folder structure is preserved.

## Deploying to GitHub Pages

The `npm run deploy` command publishes the contents of `build/` to the `docs/` folder on the `master` branch. No third-party packages are needed — it relies on git only.

**What happens:**

1. Production build (`npm run build`) — on the current working branch
2. The contents of `build/` are copied into `docs/`
3. The script switches to `master`, commits `docs/`, and pushes to `origin master`
4. Returns to the original working branch

**Removing the published site:**

```bash
npm run undeploy
```

Completely removes `docs/` from `master` (the same branch-switching algorithm: `git rm -r docs/`, commit, push, and return to the original branch).

**Requirements:**

- A git repository with a configured `origin` remote
- Push access to the repository
- The `master` branch must exist locally

**GitHub Pages setup:**

Settings → Pages → Source: `master` branch, `/docs` folder.

> The build runs on your current working branch (its code is what ends up in `docs/`), but the commit and push always go to `master` — regardless of which branch you ran the deploy from.

## Style Build

### Include Order in style.scss

```
addCssBefore → blocks (in the order of the `blocks` keys) → addCssAfter
```

The `src/scss/style.scss` file is **generated automatically** — do not edit it by hand.

### singleCompiled

Files listed in `singleCompiled` are compiled separately, each into its own `build/css/<name>.min.css`. They are not included in the main `style.min.css`.

```json
"singleCompiled": [
  "src/scss/admin.scss",
  "src/scss/landing.scss"
]
```

## JS Build

### Bundle Order

```
src/js/index.js → addJsBefore → blocks (in the order of the `blocks` keys) → addJsAfter
```

`index.js` always runs first — it contains global initialization (replacing `no-js` with `js`, fixing mobile `vh` units, lazy-loading, etc.).

Block JS files are **optional** — if a block has no `.js` file, it's skipped without error.

### copiedJs

Files listed in `copiedJs` **don't go through** esbuild — they're copied to `build/js/` as-is and included with a separate `<script>` tag in HTML.

## HTML

The `@@include` system is used as a mini-templating engine for including fragments:

```html
<!-- src/index.html -->
@@include('blocks/header/header.html')
@@include('blocks/main/main.html')
@@include('blocks/footer/footer.html')
```

Variables are supported:

```html
@@include('blocks/button/button.html', { "text": "Submit", "mod": "primary" })
```

`<!--DEV ... -->` comments are automatically stripped during the build.

### Conditional Blocks in HTML

HTML templates support only simple conditional (boolean) constructs:

```
@@if(flag)
@@if(!flag)
@@else
@@endif
```

#### Behavior

- `@@if(flag)` — the block is shown if `flag` is truthy.

- `@@if(!flag)` — the block is shown if `flag` is falsy.

- If the flag isn't passed to `@@include(...)`, it's considered falsy.

- Only one `@@else` is allowed per conditional block.

- **Nested conditional blocks are not supported!!!**

- **Expressions, comparisons, and logical operators in conditions are not supported!**

- `@@if` inside HTML comments `<!-- -->` is ignored (removed along with the comment)
  
  #### Example call:

```
  @@include('blocks/test-card/test-card.html', {
   "title": "Card",
   "isPicture": true
  })
```

#### Example template:

```
  <section class="test-card">
    <h2 class="test-card__title">@@title</h2>

    @@if(isPicture)
      <figure class="test-card__figure">
        <img class="test-card__img" src="@@img" alt="@@title">
      </figure>
    @@else
      <div class="test-card__no-image">No image</div>
    @@endif
  </section>
```

##### This kind of construct is allowed:

```
  @@if(isPicture)
    @@include('blocks/picture/picture.html')
  @@endif
```

## Incremental Build

In dev mode, assets (images, fonts, video) are copied **only if changed** (checked via file mtime). This significantly speeds up rebuilds on projects with a large number of media files.

## Build Modes

|                        | Development (`npm run dev`) | Production (`npm run build`) |
| ---------------------- | --------------------------- | ---------------------------- |
| CSS                    | expanded + sourcemaps       | compressed, no sourcemaps    |
| JS                     | unminified + sourcemaps     | minified, no sourcemaps      |
| `process.env.NODE_ENV` | `'development'`             | `'production'`               |

## Custom PostCSS Plugins

The `customPostcss.js` file in the project root lets you add your own PostCSS plugins. They're applied to all SCSS compilations (the main bundle and `singleCompiled`):

```js
// customPostcss.js
// import myPlugin from 'postcss-my-plugin';
// export default [myPlugin()];
export default [];
```

## Requirements

- Node.js ≥ 20+ (22+ recommended)
- npm ≥ 9
