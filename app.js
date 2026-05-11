const storageKey = "operyx.sales.config";

const defaultConfig = {
  plan: "pro",
  companyName: "Operyx",
  restaurantName: "Chez Thérèse et Denise",
  contactEmail: "",
  contactPhone: "",
  address: "",
  city: "Nantes",
  currency: "EUR",
  vatRate: 10,
  timezone: "Europe/Paris",
  openingHours: "Lun fermé, Mar fermé, Mer-Sam 12:00-14:00 / 19:00-22:30, Dim 12:00-14:30",
  restaurantId: "resto_001",
  schedule: {
    days: {
      mon: false,
      tue: false,
      wed: true,
      thu: true,
      fri: true,
      sat: true,
      sun: true,
    },
    lunch: true,
    dinner: true,
  },
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
    temperatureFrequency: "midi-soir",
    cleaningFrequency: "daily",
    plan: "",
    temperatureEquipment: {
      cabinet: true,
      hotPass: true,
      dessertPass: true,
      freezer: true,
    },
  },
  stock: {
    reorderThreshold: 5,
    targetFoodCost: 0.32,
    targetMargin: 0.68,
    defaultUnit: "kg",
    categories: ["Viande", "Poisson", "Fruits & légumes", "Crèmerie"],
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
    labelPrinters: 1,
    ticketPrinters: 1,
  },
  structure: {
    employees: 12,
    managers: 2,
    fridges: 3,
    freezers: 1,
    coldRooms: 1,
    dryStorage: 1,
    stockZones: 4,
    printers: 2,
    probes: 4,
  },
  onboarding: {
    role: "OWNER",
    objective: "piloter",
    seats: "40",
    sites: "1",
  },
  wizard: {
    step: 1,
    started: false,
  },
  trust: {
    encryption: true,
    backups: true,
    auditLogs: true,
    gdprExport: true,
    statusPage: true,
  },
  activation: {
    subdomain: "chez-therese-denise.operyx.app",
    status: "En attente de validation",
    dockerImage: "operyx-app:latest",
    health: "Prêt à déployer",
  },
  owner: {
    name: "Owner",
    email: "",
    password: "",
  },
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
const startConfigButton = document.getElementById("start-config");
const startConfigBottomButton = document.getElementById("start-config-bottom");
const wizardStepButtons = document.querySelectorAll("[data-wizard-step]");
const wizardPanels = document.querySelectorAll("[data-step-panel]");
const wizardShell = document.getElementById("wizard");
const wizardRecommendations = document.getElementById("wizard-recommendations");
const wizardProgress = document.getElementById("wizard-progress");
const wizardLabel = document.getElementById("wizard-label");
const wizardHint = document.getElementById("wizard-hint");
const presetButtons = document.querySelectorAll("[data-preset]");
const wizardPrev = document.getElementById("wizard-prev");
const wizardNext = document.getElementById("wizard-next");
const moduleSwitches = document.getElementById("module-switches");
const openingDaysGrid = document.getElementById("opening-days");
const stockCategoriesGrid = document.getElementById("stock-categories");
const configJson = document.getElementById("config-json");
const previewName = document.getElementById("preview-name");
const previewLocation = document.getElementById("preview-location");
const previewPlan = document.getElementById("preview-plan");
const previewModules = document.getElementById("preview-modules");
const previewHaccp = document.getElementById("preview-haccp");
const previewActivation = document.getElementById("preview-activation");
const previewStructure = document.getElementById("preview-structure");
const activationChecklist = document.getElementById("activation-checklist");
const trustGrid = document.getElementById("trust-grid");
const instanceName = document.getElementById("instance-name");
const instanceUrl = document.getElementById("instance-url");
const instanceStatus = document.getElementById("instance-status");
const instanceDocker = document.getElementById("instance-docker");
const instanceHealth = document.getElementById("instance-health");
const generateInstanceButton = document.getElementById("generate-instance");
const downloadInstanceButton = document.getElementById("download-instance");
const saveButton = document.getElementById("save-config");
const exportButton = document.getElementById("export-config");
const exportButtonInline = document.getElementById("export-config-inline");
const resetButton = document.getElementById("reset-config");
const copyButton = document.getElementById("copy-summary");
const heroRestaurant = document.getElementById("hero-restaurant");
const heroTeam = document.getElementById("hero-team");
const heroStock = document.getElementById("hero-stock");
const heroActivation = document.getElementById("hero-activation");
const reviewRestaurant = document.getElementById("review-restaurant");
const reviewTeam = document.getElementById("review-team");
const reviewEquipment = document.getElementById("review-equipment");
const reviewModules = document.getElementById("review-modules");

let state = loadConfig();
const openingDayOptions = [
  ["mon", "Lun"],
  ["tue", "Mar"],
  ["wed", "Mer"],
  ["thu", "Jeu"],
  ["fri", "Ven"],
  ["sat", "Sam"],
  ["sun", "Dim"],
];
const stockCategoryOptions = ["Viande", "Poisson", "Fruits & légumes", "Crèmerie", "Épicerie", "Boissons", "Hygiène"];

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

function computeModulesCount() {
  return Object.values(state.modules).filter(Boolean).length;
}

function updateFormFromState() {
  form.companyName.value = state.companyName;
  form.restaurantName.value = state.restaurantName;
  form.contactEmail.value = state.contactEmail;
  form.contactPhone.value = state.contactPhone || "";
  form.address.value = state.address;
  form.city.value = state.city;
  form.currency.value = state.currency;
  form.vatRate.value = state.vatRate;
  form.timezone.value = state.timezone;
  form.openingHours.value = state.openingHours;
  form.restaurantId.value = state.restaurantId;
  form.ownerName.value = state.owner?.name || "";
  form.ownerEmail.value = state.owner?.email || "";
  form.ownerPassword.value = state.owner?.password || "";
  form.ownerRole.value = state.onboarding.role;
  form.objective.value = state.onboarding.objective;
  form.seats.value = state.onboarding.seats;
  form.sites.value = state.onboarding.sites;
  form.coldMin.value = state.haccp.coldMin;
  form.coldMax.value = state.haccp.coldMax;
  form.hotMin.value = state.haccp.hotMin;
  form.haccpThreshold.value = state.haccp.threshold;
  form.temperatureFrequency.value = state.haccp.temperatureFrequency || "midi-soir";
  form.cleaningFrequency.value = state.haccp.cleaningFrequency || "daily";
  form.haccpPlan.value = state.haccp.plan || "";
  const equipment = state.haccp.temperatureEquipment || {};
  const cabinet = form.querySelector('[name="tempCabinet"]');
  const hotPass = form.querySelector('[name="tempHotPass"]');
  const dessertPass = form.querySelector('[name="tempDessertPass"]');
  const freezer = form.querySelector('[name="tempFreezer"]');
  if (cabinet) cabinet.checked = Boolean(equipment.cabinet);
  if (hotPass) hotPass.checked = Boolean(equipment.hotPass);
  if (dessertPass) dessertPass.checked = Boolean(equipment.dessertPass);
  if (freezer) freezer.checked = Boolean(equipment.freezer);
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
  form.employees.value = state.structure.employees;
  form.managers.value = state.structure.managers;
  form.fridges.value = state.structure.fridges;
  form.freezers.value = state.structure.freezers;
  form.coldRooms.value = state.structure.coldRooms;
  form.dryStorage.value = state.structure.dryStorage || 0;
  form.stockZones.value = state.structure.stockZones;
  form.printersCount.value = state.structure.printers;
  form.probes.value = state.structure.probes;
  form.labelPrinters.value = state.printers.labelPrinters || 0;
  form.ticketPrinters.value = state.printers.ticketPrinters || 0;
  openingDayOptions.forEach(([key]) => {
    const input = form.querySelector(`[data-open-day="${key}"]`);
    if (input) input.checked = Boolean(state.schedule?.days?.[key]);
  });
  const lunch = form.querySelector('[name="serviceLunch"]');
  const dinner = form.querySelector('[name="serviceDinner"]');
  if (lunch) lunch.checked = Boolean(state.schedule?.lunch);
  if (dinner) dinner.checked = Boolean(state.schedule?.dinner);
  stockCategoryOptions.forEach((label) => {
    const input = form.querySelector(`[data-stock-category="${label}"]`);
    if (input) input.checked = state.stock.categories?.includes(label);
  });
}

function updateStateFromForm() {
  state.companyName = form.companyName.value.trim() || state.companyName;
  state.restaurantName = form.restaurantName.value.trim();
  state.contactEmail = form.contactEmail.value.trim();
  state.contactPhone = form.contactPhone.value.trim();
  state.address = form.address.value.trim();
  state.city = form.city.value.trim();
  state.currency = form.currency.value.trim() || "EUR";
  state.vatRate = Number(form.vatRate.value || 0);
  state.timezone = form.timezone.value.trim() || "Europe/Paris";
  state.openingHours = form.openingHours.value.trim();
  state.restaurantId = form.restaurantId.value.trim() || state.restaurantId;
  state.owner = {
    name: form.ownerName.value.trim(),
    email: form.ownerEmail.value.trim(),
    password: form.ownerPassword.value.trim(),
  };
  state.onboarding.role = form.ownerRole.value;
  state.onboarding.objective = form.objective.value.trim();
  state.onboarding.seats = String(Number(form.seats.value || 0) || 1);
  state.onboarding.sites = String(Number(form.sites.value || 0) || 1);
  state.haccp.coldMin = form.coldMin.value.trim();
  state.haccp.coldMax = form.coldMax.value.trim();
  state.haccp.hotMin = form.hotMin.value.trim();
  state.haccp.threshold = Number(form.haccpThreshold.value || 0);
  state.haccp.temperatureFrequency = form.temperatureFrequency.value;
  state.haccp.cleaningFrequency = form.cleaningFrequency.value;
  state.haccp.plan = form.haccpPlan.value.trim();
  state.haccp.temperatureEquipment = {
    cabinet: Boolean(form.querySelector('[name="tempCabinet"]')?.checked),
    hotPass: Boolean(form.querySelector('[name="tempHotPass"]')?.checked),
    dessertPass: Boolean(form.querySelector('[name="tempDessertPass"]')?.checked),
    freezer: Boolean(form.querySelector('[name="tempFreezer"]')?.checked),
  };
  state.stock.reorderThreshold = Number(form.reorderThreshold.value || 0);
  state.stock.targetFoodCost = Number(form.targetFoodCost.value || 0);
  state.stock.targetMargin = Number(form.targetMargin.value || 0);
  state.stock.defaultUnit = form.defaultUnit.value.trim();
  state.stock.categories = stockCategoryOptions.filter((label) => {
    const input = form.querySelector(`[data-stock-category="${label}"]`);
    return Boolean(input?.checked);
  });
  state.ocr.mode = form.ocrMode.value;
  state.ocr.threshold = Number(form.ocrThreshold.value || 0);
  state.ocr.additionUrl = form.additionUrl.value.trim();
  state.printers.name = form.printer.value.trim();
  state.printers.type = form.printerType.value;
  state.printers.format = form.labelFormat.value.trim();
  state.printers.ip = form.printerIp.value.trim();
  state.printers.labelPrinters = Number(form.labelPrinters.value || 0);
  state.printers.ticketPrinters = Number(form.ticketPrinters.value || 0);
  state.structure.employees = Number(form.employees.value || 0);
  state.structure.managers = Number(form.managers.value || 0);
  state.structure.fridges = Number(form.fridges.value || 0);
  state.structure.freezers = Number(form.freezers.value || 0);
  state.structure.coldRooms = Number(form.coldRooms.value || 0);
  state.structure.dryStorage = Number(form.dryStorage.value || 0);
  state.structure.stockZones = Number(form.stockZones.value || 0);
  state.structure.printers = Number(form.printersCount.value || 0);
  state.structure.probes = Number(form.probes.value || 0);
  state.schedule = {
    days: Object.fromEntries(
      openingDayOptions.map(([key]) => [key, Boolean(form.querySelector(`[data-open-day="${key}"]`)?.checked)]),
    ),
    lunch: Boolean(form.querySelector('[name="serviceLunch"]')?.checked),
    dinner: Boolean(form.querySelector('[name="serviceDinner"]')?.checked),
  };
}

function setWizardStep(step) {
  state.wizard.step = Number(step) || 1;
  if (state.wizard.step > 1) {
    state.wizard.started = true;
  }
  renderAll();
  saveConfig();
}

function getWizardRecommendations() {
  const recommendations = [];
  if (state.structure.employees > 1) recommendations.push("Activer planning et badgeuse");
  if (state.structure.fridges + state.structure.freezers + state.structure.coldRooms > 0) recommendations.push("Conserver HACCP et températures");
  if (state.structure.stockZones > 0) recommendations.push("Activer stock et inventaires");
  if (state.structure.printers > 0) recommendations.push("Préparer impression étiquettes");
  if (state.modules.production) recommendations.push("Préparer la production labo");
  if (state.modules.orders) recommendations.push("Automatiser les commandes fournisseurs");
  if (state.onboarding.sites && Number(state.onboarding.sites) > 1) recommendations.push("Préparer le mode multi-restaurants");
  if (!state.contactEmail) recommendations.push("Ajouter un email de contact du restaurant");
  if (!state.openingHours) recommendations.push("Renseigner les horaires d'ouverture");
  return recommendations.slice(0, 6);
}

function renderWizard() {
  const started = Boolean(state.wizard.started);
  document.body.dataset.wizardStarted = started ? "true" : "false";
  if (wizardShell) {
    wizardShell.hidden = !started;
  }
  if (startConfigButton) {
    startConfigButton.textContent = started ? "Reprendre la configuration" : "Commencer la configuration";
  }
  const activeStep = Number(state.wizard.step || 1);
  wizardStepButtons.forEach((button) => {
    const step = Number(button.dataset.wizardStep);
    button.classList.toggle("active", step === activeStep);
    button.classList.toggle("completed", step < activeStep);
    button.disabled = step > activeStep;
    button.setAttribute("aria-current", step === activeStep ? "step" : "false");
  });
  wizardPanels.forEach((panel) => {
    const step = Number(panel.dataset.stepPanel);
    panel.hidden = step !== activeStep;
  });
  if (wizardProgress) {
    const progress = started ? ((activeStep - 2) / 8) * 100 : 0;
    wizardProgress.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }
  if (wizardLabel) {
    const labels = {
      2: "Restaurant",
      3: "Horaires & services",
      4: "Équipe",
      5: "Stock & zones",
      6: "HACCP",
      7: "Températures",
      8: "Impression",
      9: "Modules à activer",
      10: "Résumé",
    };
    wizardLabel.textContent = labels[activeStep] || "Bienvenue";
  }
  if (wizardHint) {
    wizardHint.textContent = started
      ? `${activeStep}/10 pour préparer le restaurant avant activation`
      : "1/10 pour découvrir l'onboarding";
  }
  if (wizardRecommendations) {
    const recommendations = getWizardRecommendations();
    wizardRecommendations.innerHTML = recommendations.length
      ? recommendations.map((item) => `<li>${item}</li>`).join("")
      : "<li>Aucune recommandation supplémentaire</li>";
  }
}

function renderOpeningDays() {
  if (!openingDaysGrid) return;
  openingDaysGrid.innerHTML = openingDayOptions
    .map(
      ([key, label]) => `
        <label class="toggle-card day-toggle">
          <input type="checkbox" data-open-day="${key}" />
          <span>${label}</span>
        </label>
      `,
    )
    .join("");
}

function renderStockCategories() {
  if (!stockCategoriesGrid) return;
  stockCategoriesGrid.innerHTML = stockCategoryOptions
    .map(
      (label) => `
        <label class="chip chip-soft">
          <input type="checkbox" data-stock-category="${label}" />
          <span>${label}</span>
        </label>
      `,
    )
    .join("");
}

function renderHero() {
  if (heroRestaurant) {
    heroRestaurant.textContent = state.restaurantName || "Restaurant";
  }
  if (heroTeam) {
    heroTeam.textContent = `${state.structure.employees} pers.`;
  }
  if (heroStock) {
    heroStock.textContent = `${state.structure.fridges} frigos`;
  }
  if (heroActivation) {
    heroActivation.textContent = state.activation.status;
  }
}

function applyPreset(preset) {
  const presets = {
    bistrot: {
      structure: {
        employees: 8,
        managers: 1,
        fridges: 2,
        freezers: 1,
        coldRooms: 0,
        stockZones: 3,
        printers: 2,
        probes: 3,
      },
      modules: {
        invoices: true,
        stock: true,
        recipes: true,
        haccp: true,
        planning: true,
        timeClock: true,
        analytics: false,
        labels: true,
        production: false,
        orders: false,
        integrations: false,
      },
    },
    gastro: {
      structure: {
        employees: 18,
        managers: 3,
        fridges: 4,
        freezers: 2,
        coldRooms: 1,
        stockZones: 5,
        printers: 3,
        probes: 6,
      },
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
        integrations: true,
      },
    },
    groupe: {
      structure: {
        employees: 40,
        managers: 6,
        fridges: 8,
        freezers: 4,
        coldRooms: 3,
        stockZones: 8,
        printers: 5,
        probes: 10,
      },
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
        integrations: true,
      },
    },
  };
  const presetConfig = presets[preset];
  if (!presetConfig) return;
  state.structure = { ...state.structure, ...presetConfig.structure };
  state.modules = { ...state.modules, ...presetConfig.modules };
  state.onboarding.sites = preset === "groupe" ? "3" : "1";
  state.plan = preset === "groupe" ? "group" : preset === "gastro" ? "pro" : "starter";
  state.wizard.started = true;
  if (state.wizard.step < 2) {
    state.wizard.step = 2;
  }
  renderAll();
  saveConfig();
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
    `Pack ${state.plan.toUpperCase()}`,
    `${computeModulesCount()} modules actifs`,
    `${state.structure.employees} employés`,
    `${state.structure.fridges} frigos / ${state.structure.freezers} congélateurs`,
    `${state.schedule.lunch ? "Midi" : ""}${state.schedule.dinner ? " / Soir" : ""}`.replace(/^ ?\/ ?| ?\/ ?$/g, "") || "Services à définir",
    `Paramètres enregistrés localement`,
  ];
  summaryList.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function renderPreview() {
  previewName.textContent = state.restaurantName || "Restaurant";
  previewLocation.textContent = [state.address, state.city].filter(Boolean).join(" · ") || "Adresse à configurer";
  previewPlan.textContent = state.plan.toUpperCase();
  previewModules.textContent = `${computeModulesCount()}`;
  previewHaccp.textContent = `${state.haccp.coldMin} / ${state.haccp.coldMax}`;
  previewActivation.textContent = state.activation.status;
  previewStructure.textContent = `${state.structure.employees} pers. · ${state.structure.fridges} frigos · ${state.structure.dryStorage || 0} réserve sèche · ${state.structure.stockZones} zones`;
  configJson.textContent = JSON.stringify(state, null, 2);
  if (reviewRestaurant) {
    reviewRestaurant.textContent = `${state.restaurantName || "Restaurant"} · ${state.city || "ville à définir"}`;
  }
  if (reviewTeam) {
    reviewTeam.textContent = `${state.structure.employees} employés / ${state.structure.managers} managers`;
  }
  if (reviewEquipment) {
    reviewEquipment.textContent = `${state.structure.fridges} frigos / ${state.structure.freezers} congélateurs / ${state.structure.dryStorage || 0} réserve sèche`;
  }
  if (reviewModules) {
    reviewModules.textContent = `${computeModulesCount()} modules actifs`;
  }
}

function renderBlueprint() {
  blueprintEmployees.textContent = state.structure.employees;
  blueprintManagers.textContent = state.structure.managers;
  blueprintFridges.textContent = state.structure.fridges;
  blueprintFreezers.textContent = state.structure.freezers;
  blueprintColdRooms.textContent = state.structure.coldRooms;
  blueprintStockZones.textContent = state.structure.stockZones;
  blueprintPrinters.textContent = state.structure.printers;
  blueprintProbes.textContent = state.structure.probes;
}

function renderTrustCenter() {
  if (!trustGrid) return;
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
  state.activation.subdomain = `${slugify(state.restaurantName)}.operyx.app`;
  if (!instanceName || !instanceUrl || !instanceStatus || !instanceDocker || !instanceHealth || !activationChecklist) {
    return;
  }
  instanceName.textContent = state.restaurantName;
  instanceUrl.textContent = `https://${state.activation.subdomain}`;
  instanceStatus.textContent = state.activation.status;
  instanceDocker.textContent = state.activation.dockerImage;
  instanceHealth.textContent = state.activation.health;
  activationChecklist.innerHTML = [
    "Compte restaurant créé",
    "Modules configurés",
    "Horaires et identité validés",
    "HACCP et stock paramétrés",
    "Impression et OCR testés",
    "Pack Docker prêt",
    "Accès client activable",
  ]
    .map((item) => `<li>${item}</li>`)
    .join("");
}

function buildActivationPack() {
  return {
    restaurant: {
      companyName: state.companyName,
      name: state.restaurantName,
      contactEmail: state.contactEmail,
      contactPhone: state.contactPhone,
      address: state.address,
      city: state.city,
      timezone: state.timezone,
      openingHours: state.openingHours,
      vatRate: state.vatRate,
      restaurantId: state.restaurantId,
    },
    subscription: {
      plan: state.plan,
      mode: "self-service",
    },
    schedule: state.schedule,
    owner: state.owner,
    onboarding: state.onboarding,
    modules: state.modules,
    haccp: state.haccp,
    stock: state.stock,
    ocr: state.ocr,
    printers: state.printers,
    structure: state.structure,
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
  renderHero();
  renderOpeningDays();
  renderStockCategories();
  renderModules();
  renderSummary();
  renderWizard();
  renderPreview();
  renderActivation();
  renderTrustCenter();
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
  `Operyx - ${state.restaurantName}`,
    `Pack: ${state.plan}`,
    `Modules actifs: ${computeModulesCount()}`,
    `Structure: ${state.structure.employees} employés / ${state.structure.fridges} frigos`,
    `Contact: ${state.contactPhone || "à compléter"} / ${state.contactEmail || "à compléter"}`,
    `Ouverture: ${state.openingHours || "à configurer"}`,
    `Services: ${(state.schedule.lunch ? "Midi" : "") + (state.schedule.dinner ? " Soir" : "")}`.trim(),
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

startConfigButton?.addEventListener("click", () => {
  state.wizard.started = true;
  if (state.wizard.step < 2) {
    state.wizard.step = 2;
  }
  saveConfig();
  renderAll();
  document.getElementById("wizard")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

startConfigBottomButton?.addEventListener("click", () => {
  startConfigButton?.click();
});

wizardStepButtons.forEach((button) => {
  button.addEventListener("click", () => setWizardStep(button.dataset.wizardStep));
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

wizardPrev?.addEventListener("click", () => {
  if (state.wizard.step <= 2) {
    state.wizard.started = false;
    state.wizard.step = 1;
  } else {
    state.wizard.step -= 1;
  }
  saveConfig();
  renderAll();
});

wizardNext?.addEventListener("click", () => {
  if (state.wizard.step < 10) {
    state.wizard.started = true;
    state.wizard.step += 1;
    saveConfig();
    renderAll();
    return;
  }
  state.activation.status = "Validation requise";
  saveConfig();
  renderAll();
});

saveButton.addEventListener("click", () => {
  updateStateFromForm();
  saveConfig();
  renderAll();
  saveButton.textContent = "Sauvegardé";
  setTimeout(() => (saveButton.textContent = "Sauvegarder"), 1200);
});

exportButton.addEventListener("click", downloadJson);
exportButtonInline?.addEventListener("click", downloadJson);
resetButton.addEventListener("click", resetConfig);
copyButton.addEventListener("click", copySummary);
generateInstanceButton.addEventListener("click", () => {
  state.activation.status = "Validation requise";
  saveConfig();
  renderAll();
});
downloadInstanceButton.addEventListener("click", downloadActivationPack);

renderAll();
