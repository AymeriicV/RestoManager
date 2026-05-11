const storageKey = "restomanager.sales.config";

const defaultConfig = {
  plan: "pro",
  restaurantName: "Chez Thérèse et Denise",
  address: "",
  city: "Nantes",
  currency: "EUR",
  vatRate: 10,
  timezone: "Europe/Paris",
  restaurantId: "resto_001",
  modules: {
    invoices: true,
    stock: true,
    recipes: true,
    haccp: true,
    planning: true,
    timeClock: true,
    analytics: true,
    labels: true,
    production: true,
    orders: true,
    integrations: false,
  },
  haccp: {
    coldMin: "0°C",
    coldMax: "4°C",
    hotMin: "63°C",
    threshold: 95,
  },
  stock: {
    reorderThreshold: 5,
    targetFoodCost: 0.32,
    targetMargin: 0.68,
    defaultUnit: "kg",
  },
  ocr: {
    mode: "hybrid",
    threshold: 0.75,
    additionUrl: "",
  },
  printers: {
    name: "Imprimante cuisine",
    type: "browser",
    format: "58mm",
    ip: "",
  },
};

const planPrices = {
  starter: 79,
  pro: 149,
  group: 249,
};

const modulePrices = {
  labels: 12,
  production: 19,
  analytics: 29,
  integrations: 39,
  orders: 24,
};

const moduleLabels = {
  invoices: "Factures OCR",
  stock: "Stock",
  recipes: "Fiches techniques",
  haccp: "HACCP / PMS",
  planning: "Planning",
  timeClock: "Badgeuse",
  analytics: "Analytics",
  labels: "Étiquettes",
  production: "Production",
  orders: "Commandes",
  integrations: "Intégrations",
};

const form = document.getElementById("restaurant-form");
const summaryList = document.getElementById("commercial-summary");
const moduleSwitches = document.getElementById("module-switches");
const configJson = document.getElementById("config-json");
const previewName = document.getElementById("preview-name");
const previewLocation = document.getElementById("preview-location");
const previewPlan = document.getElementById("preview-plan");
const previewPrice = document.getElementById("preview-price");
const previewModules = document.getElementById("preview-modules");
const previewHaccp = document.getElementById("preview-haccp");
const saveButton = document.getElementById("save-config");
const exportButton = document.getElementById("export-config");
const resetButton = document.getElementById("reset-config");
const copyButton = document.getElementById("copy-summary");
const selectPlanButtons = document.querySelectorAll("[data-select-plan]");

let state = loadConfig();

function loadConfig() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return structuredClone(defaultConfig);
    return { ...structuredClone(defaultConfig), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultConfig);
  }
}

function saveConfig() {
  localStorage.setItem(storageKey, JSON.stringify(state, null, 2));
}

function money(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: state.currency || "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function computeModulesCount() {
  return Object.values(state.modules).filter(Boolean).length;
}

function computeMonthlyPrice() {
  const base = planPrices[state.plan] ?? planPrices.pro;
  const addons = Object.entries(state.modules)
    .filter(([, enabled]) => enabled)
    .reduce((sum, [key]) => sum + (modulePrices[key] ?? 0), 0);
  return base + addons;
}

function updateFormFromState() {
  form.restaurantName.value = state.restaurantName;
  form.address.value = state.address;
  form.city.value = state.city;
  form.currency.value = state.currency;
  form.vatRate.value = state.vatRate;
  form.timezone.value = state.timezone;
  form.restaurantId.value = state.restaurantId;
  form.coldMin.value = state.haccp.coldMin;
  form.coldMax.value = state.haccp.coldMax;
  form.hotMin.value = state.haccp.hotMin;
  form.haccpThreshold.value = state.haccp.threshold;
  form.reorderThreshold.value = state.stock.reorderThreshold;
  form.targetFoodCost.value = state.stock.targetFoodCost;
  form.targetMargin.value = state.stock.targetMargin;
  form.defaultUnit.value = state.stock.defaultUnit;
  form.ocrMode.value = state.ocr.mode;
  form.ocrThreshold.value = state.ocr.threshold;
  form.additionUrl.value = state.ocr.additionUrl;
  form.printer.value = state.printers.name;
  form.printerType.value = state.printers.type;
  form.labelFormat.value = state.printers.format;
  form.printerIp.value = state.printers.ip;
}

function updateStateFromForm() {
  state.restaurantName = form.restaurantName.value.trim();
  state.address = form.address.value.trim();
  state.city = form.city.value.trim();
  state.currency = form.currency.value.trim() || "EUR";
  state.vatRate = Number(form.vatRate.value || 0);
  state.timezone = form.timezone.value.trim() || "Europe/Paris";
  state.restaurantId = form.restaurantId.value.trim() || state.restaurantId;
  state.haccp.coldMin = form.coldMin.value.trim();
  state.haccp.coldMax = form.coldMax.value.trim();
  state.haccp.hotMin = form.hotMin.value.trim();
  state.haccp.threshold = Number(form.haccpThreshold.value || 0);
  state.stock.reorderThreshold = Number(form.reorderThreshold.value || 0);
  state.stock.targetFoodCost = Number(form.targetFoodCost.value || 0);
  state.stock.targetMargin = Number(form.targetMargin.value || 0);
  state.stock.defaultUnit = form.defaultUnit.value.trim();
  state.ocr.mode = form.ocrMode.value;
  state.ocr.threshold = Number(form.ocrThreshold.value || 0);
  state.ocr.additionUrl = form.additionUrl.value.trim();
  state.printers.name = form.printer.value.trim();
  state.printers.type = form.printerType.value;
  state.printers.format = form.labelFormat.value.trim();
  state.printers.ip = form.printerIp.value.trim();
}

function renderModules() {
  moduleSwitches.innerHTML = "";
  Object.entries(moduleLabels).forEach(([key, label]) => {
    const wrapper = document.createElement("label");
    wrapper.className = "chip";
    wrapper.innerHTML = `
      <input type="checkbox" name="module-${key}" ${state.modules[key] ? "checked" : ""} />
      <span>${label}</span>
    `;
    const checkbox = wrapper.querySelector("input");
    checkbox.addEventListener("change", () => {
      state.modules[key] = checkbox.checked;
      renderAll();
      saveConfig();
    });
    moduleSwitches.appendChild(wrapper);
  });
}

function renderSummary() {
  const items = [
    `Forfait ${state.plan.toUpperCase()}`,
    `${computeModulesCount()} modules actifs`,
    `${money(computeMonthlyPrice())} / mois`,
    `TVA ${state.vatRate}%`,
    `Paramètres enregistrés localement`,
  ];
  summaryList.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function renderPreview() {
  previewName.textContent = state.restaurantName || "Restaurant";
  previewLocation.textContent = [state.address, state.city].filter(Boolean).join(" · ") || "Adresse à configurer";
  previewPlan.textContent = state.plan.toUpperCase();
  previewPrice.textContent = `${money(computeMonthlyPrice())}/mois`;
  previewModules.textContent = `${computeModulesCount()}`;
  previewHaccp.textContent = `${state.haccp.coldMin} / ${state.haccp.coldMax}`;
  configJson.textContent = JSON.stringify(state, null, 2);
}

function renderAll() {
  updateFormFromState();
  renderModules();
  renderSummary();
  renderPreview();
  document.querySelectorAll(".price-card").forEach((card) => {
    card.classList.toggle("featured", card.dataset.plan === state.plan);
  });
}

function setPlan(plan) {
  state.plan = plan;
  renderAll();
  saveConfig();
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(state.restaurantName || "resto").toLowerCase().replace(/\s+/g, "-")}-config.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetConfig() {
  state = structuredClone(defaultConfig);
  saveConfig();
  renderAll();
}

function copySummary() {
  const text = [
    `RestoManager - ${state.restaurantName}`,
    `Forfait: ${state.plan}`,
    `Prix mensuel estimé: ${money(computeMonthlyPrice())}`,
    `Modules actifs: ${computeModulesCount()}`,
    `HACCP: ${state.haccp.coldMin} / ${state.haccp.coldMax}`,
    `OCR: ${state.ocr.mode} (${state.ocr.threshold})`,
    `Impression: ${state.printers.type} / ${state.printers.format}`,
  ].join("\n");
  navigator.clipboard.writeText(text);
}

form.addEventListener("input", () => {
  updateStateFromForm();
  renderAll();
});

selectPlanButtons.forEach((button) => {
  button.addEventListener("click", () => setPlan(button.dataset.selectPlan));
});

saveButton.addEventListener("click", () => {
  updateStateFromForm();
  saveConfig();
  renderAll();
  saveButton.textContent = "Sauvegardé";
  setTimeout(() => (saveButton.textContent = "Sauvegarder"), 1200);
});

exportButton.addEventListener("click", downloadJson);
resetButton.addEventListener("click", resetConfig);
copyButton.addEventListener("click", copySummary);

renderAll();
