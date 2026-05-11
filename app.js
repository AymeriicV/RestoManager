const storageKey = "restomanager.sales.config";

const defaultConfig = {
  plan: "pro",
  companyName: "RestoManager",
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
  onboarding: {
    role: "OWNER",
    objective: "piloter",
    seats: "40",
    sites: "1",
  },
  trust: {
    encryption: true,
    backups: true,
    auditLogs: true,
    gdprExport: true,
    statusPage: true,
  },
  activation: {
    subdomain: "chez-therese-denise.restomanager.app",
    status: "En attente de validation",
    dockerImage: "restomanager-app:latest",
    health: "Prêt à déployer",
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
const trustGrid = document.getElementById("trust-grid");
const activationChecklist = document.getElementById("activation-checklist");
const instanceName = document.getElementById("instance-name");
const instanceUrl = document.getElementById("instance-url");
const instanceStatus = document.getElementById("instance-status");
const instanceDocker = document.getElementById("instance-docker");
const instanceHealth = document.getElementById("instance-health");
const generateInstanceButton = document.getElementById("generate-instance");
const downloadInstanceButton = document.getElementById("download-instance");
const quoteBox = document.getElementById("quote-box");
const downloadQuoteButton = document.getElementById("download-quote");
const copyQuoteButton = document.getElementById("copy-quote");
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
    return deepMerge(structuredClone(defaultConfig), JSON.parse(raw));
  } catch {
    return structuredClone(defaultConfig);
  }
}

function deepMerge(base, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return incoming ?? base;
  }
  const output = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (value && typeof value === "object" && !Array.isArray(value) && base && typeof base === "object" && !Array.isArray(base[key])) {
      output[key] = deepMerge(base[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
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

function renderTrustCenter() {
  const items = [
    {
      title: "Chiffrement",
      value: state.trust.encryption ? "Actif" : "À activer",
      detail: "Données et sauvegardes protégées",
    },
    {
      title: "Sauvegardes",
      value: state.trust.backups ? "Planifiées" : "Manuelles",
      detail: "Export et restauration documentés",
    },
    {
      title: "Journaux d'audit",
      value: state.trust.auditLogs ? "Disponibles" : "Limité",
      detail: "Traçabilité des actions critiques",
    },
    {
      title: "RGPD",
      value: state.trust.gdprExport ? "Export prêt" : "À configurer",
      detail: "Suppression et export des données",
    },
    {
      title: "Page statut",
      value: state.trust.statusPage ? "Prévue" : "À construire",
      detail: "Disponibilité et incidents",
    },
  ];
  trustGrid.innerHTML = items
    .map(
      (item) => `
        <article class="trust-card">
          <p class="eyebrow">${item.title}</p>
          <h3>${item.value}</h3>
          <p>${item.detail}</p>
        </article>
      `,
    )
    .join("");
}

function slugify(value) {
  return (value || "restaurant")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderActivation() {
  state.activation.subdomain = `${slugify(state.restaurantName)}.restomanager.app`;
  instanceName.textContent = state.restaurantName;
  instanceUrl.textContent = `https://${state.activation.subdomain}`;
  instanceStatus.textContent = state.activation.status;
  instanceDocker.textContent = state.activation.dockerImage;
  instanceHealth.textContent = state.activation.health;
  activationChecklist.innerHTML = [
    "Compte restaurant créé",
    "Modules configurés",
    "HACCP et stock paramétrés",
    "Impression et OCR testés",
    "Pack Docker prêt",
    "Accès client activable",
  ]
    .map((item) => `<li>${item}</li>`)
    .join("");
}

function buildQuote() {
  const monthly = computeMonthlyPrice();
  const setup = state.plan === "group" ? 590 : state.plan === "pro" ? 390 : 190;
  const addons = Object.entries(state.modules)
    .filter(([, enabled]) => enabled)
    .filter(([key]) => modulePrices[key])
    .map(([key]) => `${moduleLabels[key]}: ${money(modulePrices[key])}`)
    .join("<br>");
  quoteBox.innerHTML = `
    <div class="quote-grid">
      <div>
        <p class="eyebrow">Client</p>
        <h3>${state.restaurantName}</h3>
        <p class="muted">${[state.address, state.city].filter(Boolean).join(" · ") || "À configurer"}</p>
      </div>
      <div>
        <p class="eyebrow">Forfait</p>
        <h3>${state.plan.toUpperCase()}</h3>
        <p class="muted">${money(monthly)} / mois</p>
      </div>
      <div>
        <p class="eyebrow">Frais de mise en service</p>
        <h3>${money(setup)}</h3>
        <p class="muted">Paramétrage, import et accompagnement</p>
      </div>
      <div>
        <p class="eyebrow">Modules activés</p>
        <h3>${computeModulesCount()}</h3>
        <p class="muted">Base de configuration self-service</p>
      </div>
    </div>
    <div class="quote-details">
      <div>
        <strong>Options incluses</strong>
        <p class="muted">${addons || "Aucune option supplémentaire"}</p>
      </div>
      <div>
        <strong>Résumé métier</strong>
        <p class="muted">
          HACCP ${state.haccp.coldMin} à ${state.haccp.coldMax}, objectif food cost ${Math.round(state.stock.targetFoodCost * 100)} %, imprimante ${state.printers.type}.
        </p>
      </div>
    </div>
  `;
}

function buildActivationPack() {
  return {
    restaurant: {
      name: state.restaurantName,
      address: state.address,
      city: state.city,
      timezone: state.timezone,
      vatRate: state.vatRate,
      restaurantId: state.restaurantId,
    },
    subscription: {
      plan: state.plan,
      monthlyPrice: computeMonthlyPrice(),
      setupFee: state.plan === "group" ? 590 : state.plan === "pro" ? 390 : 190,
    },
    modules: state.modules,
    haccp: state.haccp,
    stock: state.stock,
    ocr: state.ocr,
    printers: state.printers,
    trust: state.trust,
    activation: state.activation,
    docker: {
      image: state.activation.dockerImage,
      port: 3001,
      mode: "per-tenant",
      network: "isolated",
    },
  };
}

function downloadActivationPack() {
  const blob = new Blob([JSON.stringify(buildActivationPack(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(state.restaurantName)}-activation-pack.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderAll() {
  updateFormFromState();
  renderModules();
  renderSummary();
  renderPreview();
  renderTrustCenter();
  renderActivation();
  buildQuote();
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

function quoteText() {
  return [
    `RestoManager - Devis`,
    `Restaurant: ${state.restaurantName}`,
    `Ville: ${state.city}`,
    `Forfait: ${state.plan}`,
    `Mensuel: ${money(computeMonthlyPrice())}`,
    `Setup: ${money(state.plan === "group" ? 590 : state.plan === "pro" ? 390 : 190)}`,
    `Modules: ${computeModulesCount()}`,
    `HACCP: ${state.haccp.coldMin} / ${state.haccp.coldMax}`,
    `OCR: ${state.ocr.mode} (${state.ocr.threshold})`,
    `Imprimante: ${state.printers.type} / ${state.printers.format}`,
  ].join("\n");
}

function downloadQuote() {
  const blob = new Blob([quoteText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(state.restaurantName || "resto").toLowerCase().replace(/\s+/g, "-")}-devis.txt`;
  a.click();
  URL.revokeObjectURL(url);
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
downloadQuoteButton.addEventListener("click", downloadQuote);
copyQuoteButton.addEventListener("click", () => navigator.clipboard.writeText(quoteText()));
generateInstanceButton.addEventListener("click", () => {
  state.activation.status = "Validation requise";
  saveConfig();
  renderAll();
});
downloadInstanceButton.addEventListener("click", downloadActivationPack);

renderAll();
