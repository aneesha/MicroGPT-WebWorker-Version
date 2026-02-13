import {
  docsFromText,
  validateConfig,
  ensureEnoughDocs,
  buildSpeedText,
  computeDatasetStats,
} from "./utils.js";

const DATASET_URL =
  "https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt";

const el = {
  datasetUrl: document.getElementById("datasetUrl"),
  datasetState: document.getElementById("datasetState"),
  datasetDocs: document.getElementById("datasetDocs"),
  datasetVocab: document.getElementById("datasetVocab"),
  datasetAvgLength: document.getElementById("datasetAvgLength"),
  numSteps: document.getElementById("numSteps"),
  learningRate: document.getElementById("learningRate"),
  seed: document.getElementById("seed"),
  reportEvery: document.getElementById("reportEvery"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  statusValue: document.getElementById("statusValue"),
  stepValue: document.getElementById("stepValue"),
  lossValue: document.getElementById("lossValue"),
  speedValue: document.getElementById("speedValue"),
  logs: document.getElementById("logs"),
  samples: document.getElementById("samples"),
  generateWrap: document.getElementById("generateWrap"),
  generateCount: document.getElementById("generateCount"),
  generateBtn: document.getElementById("generateBtn"),
};

let worker = null;
let startedAt = 0;
let datasetDocs = null;
let isTraining = false;
let hasTrainedModel = false;

const lossData = {
  labels: [],
  values: [],
};

const chart = new Chart(document.getElementById("lossChart"), {
  type: "line",
  data: {
    labels: lossData.labels,
    datasets: [
      {
        label: "loss",
        data: lossData.values,
        borderColor: "#0c9f9b",
        backgroundColor: "rgba(12, 159, 155, 0.2)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.22,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        title: { display: true, text: "Step" },
        grid: { color: "rgba(16, 36, 61, 0.07)" },
      },
      y: {
        title: { display: true, text: "Loss" },
        grid: { color: "rgba(16, 36, 61, 0.07)" },
      },
    },
  },
});

function createWorker() {
  if (worker) {
    worker.terminate();
  }

  worker = new Worker("./worker.js");

  worker.onmessage = (event) => {
    const data = event.data || {};

    if (data.type === "status") {
      appendLog(data.message || "status");
      return;
    }

    if (data.type === "step") {
      updateProgress(data);
      return;
    }

    if (data.type === "done") {
      isTraining = false;
      hasTrainedModel = true;
      syncButtons();
      setStatus("Training Complete");
      el.generateWrap.hidden = false;
      appendLog(`Training complete. Final loss: ${toFixed(data.final_loss, 4)}`);
      return;
    }

    if (data.type === "generated") {
      renderSamples(data.samples || []);
      appendLog(`Generated ${data.count || 0} names.`);
      syncButtons();
      return;
    }

    if (data.type === "error") {
      isTraining = false;
      syncButtons();
      setStatus("Error");
      appendLog(data.message || "Unknown worker error");
    }
  };

  worker.onerror = (event) => {
    isTraining = false;
    syncButtons();
    setStatus("Error");
    appendLog(`Worker crashed: ${event.message}`);
  };
}

async function loadDataset() {
  setDatasetState("Loading...");
  el.startBtn.disabled = true;
  el.datasetUrl.value = DATASET_URL;

  const response = await fetch(DATASET_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Dataset request failed (${response.status}).`);
  }

  const text = await response.text();
  const docs = docsFromText(text);
  ensureEnoughDocs(docs);

  datasetDocs = docs;
  const stats = computeDatasetStats(docs);
  el.datasetDocs.textContent = String(stats.docsCount);
  el.datasetVocab.textContent = String(stats.vocabSize);
  el.datasetAvgLength.textContent = stats.avgLength.toFixed(2);
  setDatasetState("Loaded");
  appendLog(`Loaded names dataset (${stats.docsCount} rows).`);
  syncButtons();
}

function setDatasetState(text) {
  el.datasetState.textContent = text;
}

function updateProgress(data) {
  const step = Number(data.step || 0);
  const loss = Number(data.loss || 0);

  el.stepValue.textContent = `${step}`;
  el.lossValue.textContent = toFixed(loss, 4);

  const elapsed = (performance.now() - startedAt) / 1000;
  el.speedValue.textContent = buildSpeedText(step, elapsed);

  lossData.labels.push(step);
  lossData.values.push(loss);
  trimChart(700);
  chart.update("none");

  if (step === 1 || step % 25 === 0) {
    appendLog(`step ${step} | loss ${toFixed(loss, 4)}`);
  }
}

function trimChart(maxPoints) {
  while (lossData.labels.length > maxPoints) {
    lossData.labels.shift();
    lossData.values.shift();
  }
}

function resetMonitor() {
  lossData.labels.length = 0;
  lossData.values.length = 0;
  chart.update();
  el.stepValue.textContent = "0";
  el.lossValue.textContent = "-";
  el.speedValue.textContent = "-";
  el.logs.textContent = "";
  el.samples.innerHTML = "";
}

function setStatus(text) {
  el.statusValue.textContent = text;
}

function syncButtons() {
  const datasetReady = Array.isArray(datasetDocs) && datasetDocs.length > 1;
  el.startBtn.disabled = isTraining || !datasetReady;
  el.stopBtn.disabled = !isTraining;
  el.generateBtn.disabled = isTraining || !hasTrainedModel;
}

function appendLog(line) {
  const ts = new Date().toLocaleTimeString();
  const prefix = `[${ts}] `;
  if (!el.logs.textContent.trim()) {
    el.logs.textContent = `${prefix}${line}`;
  } else {
    el.logs.textContent += `\n${prefix}${line}`;
  }
  el.logs.scrollTop = el.logs.scrollHeight;
}

function renderSamples(samples) {
  el.samples.innerHTML = "";
  for (const sample of samples) {
    const li = document.createElement("li");
    li.textContent = sample;
    el.samples.appendChild(li);
  }
}

function toFixed(value, digits) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    return "-";
  }
  return n.toFixed(digits);
}

el.startBtn.addEventListener("click", () => {
  if (!datasetDocs) {
    appendLog("Dataset is not loaded yet.");
    return;
  }

  try {
    isTraining = true;
    hasTrainedModel = false;
    el.generateWrap.hidden = true;
    syncButtons();
    setStatus("Training");
    resetMonitor();
    appendLog("Starting training...");

    const config = validateConfig({
      num_steps: el.numSteps.value,
      learning_rate: el.learningRate.value,
      seed: el.seed.value,
      report_every: el.reportEvery.value,
    });

    createWorker();
    startedAt = performance.now();
    worker.postMessage({
      type: "start",
      datasetText: datasetDocs.join("\n"),
      config,
    });
  } catch (error) {
    isTraining = false;
    syncButtons();
    setStatus("Error");
    appendLog(error.message || String(error));
  }
});

el.stopBtn.addEventListener("click", () => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  isTraining = false;
  hasTrainedModel = false;
  syncButtons();
  setStatus("Stopped");
  el.generateWrap.hidden = true;
  appendLog("Training stopped.");
});

el.generateBtn.addEventListener("click", () => {
  if (!worker || !hasTrainedModel) {
    appendLog("Train the model first before generating names.");
    return;
  }

  const count = Number.parseInt(el.generateCount.value, 10);
  el.generateBtn.disabled = true;
  appendLog(`Generating ${count} names...`);
  worker.postMessage({ type: "generate", count });
});

(async () => {
  try {
    setStatus("Idle");
    syncButtons();
    await loadDataset();
  } catch (error) {
    setDatasetState("Failed");
    setStatus("Error");
    appendLog(error.message || String(error));
    syncButtons();
  }
})();
