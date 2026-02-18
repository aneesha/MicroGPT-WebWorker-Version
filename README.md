# MicroGPT WebWorker Version

A browser-based port of Andrej Karpathy's pure-Python MicroGPT implementation:
[MicroGPT gist](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95)

## What this app does

- Runs MicroGPT training in the browser using Pyodide in a Web Worker
- Uses a hardcoded names dataset (`makemore/names.txt`)
- Displays live training loss, step, speed, and logs
- Shows dataset load state and dataset stats (rows, vocab size, average length)
- After training completes, lets you generate `5`, `10`, or `15` names on demand

## Convergence improvements in this version

Compared with the original minimalist loop, this browser implementation adds a few extra training lines to improve stability and convergence:

- Mini-batch updates (`batch_size=4`) instead of single-document updates
- Learning-rate warmup followed by cosine decay
- Global gradient clipping before Adam updates
- Slightly smaller initialization scale for weights

## Project structure

- Source files: `/Users/uqabakh1/research/2026/codex-projects/MicroGPT-WebWorker-Version/src`
- Tests: `/Users/uqabakh1/research/2026/codex-projects/MicroGPT-WebWorker-Version/tests`
- Runnable output: `/Users/uqabakh1/research/2026/codex-projects/MicroGPT-WebWorker-Version/dist`

## Run locally

1. Install dependencies (none required beyond Node for tests/build scripts).
2. Run tests:
   - `npm test`
3. Build dist output:
   - `npm run build`
4. Serve the directory as static files (required for worker + fetch):
   - `python -m http.server`
   - Node option (no install): `npx serve .`
   - Node option (http-server): `npx http-server .`
5. Open:
   - `/Users/uqabakh1/research/2026/codex-projects/MicroGPT-WebWorker-Version/dist/index.html`

## Notes

- The dataset is names-only, so the trained model generates name-like strings.
- Training happens fully client-side in your browser session.
