const MIN_DOCS = 2;

export function docsFromText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateConfig(rawConfig = {}) {
  const cfg = {
    num_steps: clampInt(rawConfig.num_steps, 10, 5000, 500),
    learning_rate: clampFloat(rawConfig.learning_rate, 0.0001, 0.5, 0.01),
    seed: clampInt(rawConfig.seed, 0, 999999, 42),
    report_every: clampInt(rawConfig.report_every, 1, 200, 1),
    batch_size: clampInt(rawConfig.batch_size, 1, 32, 4),
    warmup_steps: clampInt(rawConfig.warmup_steps, 1, 1000, 40),
    min_lr_ratio: clampFloat(rawConfig.min_lr_ratio, 0.01, 1, 0.15),
    grad_clip: clampFloat(rawConfig.grad_clip, 0.1, 5, 1.0),
  };
  return cfg;
}

export function ensureEnoughDocs(docs) {
  if (!Array.isArray(docs) || docs.length < MIN_DOCS) {
    throw new Error("Dataset must contain at least two non-empty lines.");
  }
}

export function computeDatasetStats(docs) {
  ensureEnoughDocs(docs);
  const charSet = new Set();
  let totalLength = 0;

  for (const doc of docs) {
    totalLength += doc.length;
    for (const ch of doc) {
      charSet.add(ch);
    }
  }

  return {
    docsCount: docs.length,
    vocabSize: charSet.size + 1,
    avgLength: totalLength / docs.length,
  };
}

export function buildSpeedText(step, elapsedSeconds) {
  if (!step || !elapsedSeconds || elapsedSeconds <= 0) {
    return "-";
  }
  return `${(step / elapsedSeconds).toFixed(1)} step/s`;
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

function clampFloat(value, min, max, fallback) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}
