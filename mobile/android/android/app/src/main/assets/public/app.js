(function () {
  const STORAGE_KEYS = {
    instanceUrl: "operyx.android.instanceUrl",
    instanceName: "operyx.android.instanceName",
    recentInstances: "operyx.android.recentInstances",
    printer: "operyx.android.printer",
  };

  const state = {
    instanceUrl: "",
    instanceName: "",
    recentInstances: [],
    printer: {
      name: "",
      target: "",
      type: "bluetooth",
    },
    printers: [],
    currentRoute: "/",
    history: ["/"],
    historyIndex: 0,
    mobileScreen: "home",
    selectedFile: null,
    shellReady: false,
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function readJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?(\/.*)?$/i.test(raw)) {
      return `http://${raw}`.replace(/\/+$/, "");
    }
    return `https://${raw}`.replace(/\/+$/, "");
  }

  function plugin(name) {
    return window.Capacitor?.Plugins?.[name] || window.Capacitor?.Plugins?.[name[0].toUpperCase() + name.slice(1)];
  }

  function isNative() {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  }

  function routeUrl(route) {
    const base = state.instanceUrl.replace(/\/+$/, "");
    if (!base) return "/";
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    return `${base}${cleanRoute}`;
  }

  function currentFrameUrl() {
    return routeUrl(state.currentRoute);
  }

  function readRouteFromHash() {
    const match = window.location.hash.match(/^#route=(.*)$/);
    if (!match) return "/";
    try {
      return decodeURIComponent(match[1] || "/") || "/";
    } catch {
      return "/";
    }
  }

  function writeRouteToHash(route, replace = false) {
    const encoded = `#route=${encodeURIComponent(route || "/")}`;
    if (replace) {
      window.history.replaceState({ route }, "", encoded);
      return;
    }
    if (window.location.hash === encoded) return;
    window.location.hash = encoded;
  }

  function syncRouteFromHash() {
    const nextRoute = readRouteFromHash();
    if (!state.instanceUrl) return;
    if (nextRoute !== state.currentRoute) {
      openWorkspace(nextRoute, false);
      renderNativeScreen(nextRoute);
    }
  }

  function pushRoute(route, replace = false) {
    const normalized = route.startsWith("/") ? route : `/${route}`;
    if (replace) {
      state.history = [normalized];
      state.historyIndex = 0;
      writeRouteToHash(normalized, true);
      return;
    }
    const current = state.history[state.historyIndex] || "/";
    if (current === normalized) {
      writeRouteToHash(normalized, false);
      return;
    }
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(normalized);
    state.historyIndex = state.history.length - 1;
    writeRouteToHash(normalized, false);
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    }
  }

  function goForward() {
    window.history.forward();
  }

  async function requestChrome() {
    try {
      await plugin("StatusBar")?.setStyle?.({ style: "DARK" });
      await plugin("StatusBar")?.setBackgroundColor?.({ color: "#0b0f16" });
      await plugin("SplashScreen")?.hide?.();
    } catch {
      // noop
    }
  }

  async function bootShell() {
    state.instanceUrl = normalizeUrl(window.localStorage.getItem(STORAGE_KEYS.instanceUrl) || "");
    state.instanceName = window.localStorage.getItem(STORAGE_KEYS.instanceName) || "";
    state.recentInstances = readJson(STORAGE_KEYS.recentInstances, []);
    state.printer = readJson(STORAGE_KEYS.printer, { name: "", target: "", type: "bluetooth" });
    bindGlobals();
    syncInputs();
    await requestChrome();
    await refreshNetwork();
    render();
    if (state.instanceUrl) {
      const route = readRouteFromHash();
      navigate(route, true);
    } else {
      showSetup();
    }
  }

  function bindGlobals() {
    els.setupPanel = $("setup-panel");
    els.workspace = $("workspace");
    els.instanceUrl = $("instance-url");
    els.instanceName = $("instance-name");
    els.recentInstances = $("recent-instances");
    els.shellTitle = $("shell-title");
    els.workspaceTitle = $("workspace-title");
    els.workspaceSubtitle = $("workspace-subtitle");
    els.instanceLabel = $("instance-label");
    els.siteFrame = $("site-frame");
    els.framePath = $("frame-path");
    els.networkPill = $("network-pill");
    els.printerPill = $("printer-pill");
    els.shellPill = $("shell-pill");
    els.nativeScreen = $("native-screen");
    els.nativeScreenKicker = $("native-screen-kicker");
    els.nativeScreenTitle = $("native-screen-title");
    els.nativeScreenGrid = $("native-screen-grid");
    els.drawer = $("drawer");
    els.printerList = $("printer-list");
    els.printerTarget = $("printer-target");
    els.printerName = $("printer-name");
    els.filePreview = $("file-preview");
    els.hiddenFile = $("hidden-file");
    els.hiddenCamera = $("hidden-camera");

    $("btn-save-instance").addEventListener("click", saveInstance);
    $("btn-demo-instance").addEventListener("click", demoInstance);
    $("btn-fullscreen").addEventListener("click", openFullscreen);
    $("btn-settings").addEventListener("click", toggleDrawer);
    $("btn-close-drawer").addEventListener("click", closeDrawer);
    $("btn-reload-frame").addEventListener("click", () => openWorkspace(state.currentRoute, true));
    $("btn-back").addEventListener("click", goBack);
    $("btn-forward").addEventListener("click", goForward);
    $("btn-scan-printers").addEventListener("click", scanPrinters);
    $("btn-save-printer").addEventListener("click", savePrinter);
    $("btn-test-print").addEventListener("click", testPrinter);
    $("btn-camera").addEventListener("click", () => {
      navigate("/invoices", false);
      triggerFilePicker(els.hiddenCamera);
    });
    $("btn-gallery").addEventListener("click", () => {
      navigate("/invoices", false);
      triggerFilePicker(els.hiddenFile);
    });
    $("btn-capture-invoice").addEventListener("click", () => {
      navigate("/invoices", false);
      triggerFilePicker(els.hiddenCamera);
    });
    $("btn-pick-file").addEventListener("click", () => {
      navigate("/invoices", false);
      triggerFilePicker(els.hiddenFile);
    });
    $("btn-share").addEventListener("click", shareCurrentRoute);
    $("btn-notifications").addEventListener("click", requestNotifications);
    els.siteFrame.addEventListener("load", () => {
      emitToSite({
        type: "operyx-mobile:ready",
        instanceUrl: state.instanceUrl,
        instanceName: state.instanceName,
        printer: state.printer,
      });
    });

    document.querySelectorAll("[data-route]").forEach((button) => {
      button.addEventListener("click", () => navigate(button.getAttribute("data-route") || "/", false));
    });

    els.instanceUrl.addEventListener("change", renderRecent);
    els.instanceName.addEventListener("change", renderRecent);
    els.hiddenFile.addEventListener("change", onFileSelected);
    els.hiddenCamera.addEventListener("change", onFileSelected);
    window.addEventListener("online", refreshNetwork);
    window.addEventListener("offline", refreshNetwork);
    window.addEventListener("hashchange", syncRouteFromHash);
  }

  function syncInputs() {
    els.instanceUrl.value = state.instanceUrl;
    els.instanceName.value = state.instanceName;
    els.printerTarget.value = state.printer.target || "";
    els.printerName.value = state.printer.name || "";
  }

  function persistInstance(nextUrl, nextName) {
    state.instanceUrl = nextUrl;
    state.instanceName = nextName;
    window.localStorage.setItem(STORAGE_KEYS.instanceUrl, nextUrl);
    window.localStorage.setItem(STORAGE_KEYS.instanceName, nextName);
    const entry = { url: nextUrl, name: nextName || nextUrl.replace(/^https?:\/\//, "").split("/")[0] };
    const next = [entry, ...state.recentInstances.filter((item) => item.url !== nextUrl)].slice(0, 8);
    state.recentInstances = next;
    writeJson(STORAGE_KEYS.recentInstances, next);
  }

  function persistPrinter(printer) {
    state.printer = printer;
    writeJson(STORAGE_KEYS.printer, printer);
    emitToSite({
      type: "operyx-mobile:printer",
      printer,
    });
  }

  function showSetup() {
    els.setupPanel.classList.remove("hidden");
    els.workspace.classList.add("hidden");
    renderRecent();
  }

  function renderRecent() {
    const list = state.recentInstances || [];
    if (!els.recentInstances) return;
    els.recentInstances.innerHTML = list.length
      ? list
          .map(
            (entry) => `
              <button class="recent-chip" data-recent-url="${escapeHtml(entry.url)}" data-recent-name="${escapeHtml(entry.name || "")}">
                <strong>${escapeHtml(entry.name || entry.url)}</strong>
                <span>${escapeHtml(entry.url)}</span>
              </button>
            `,
          )
          .join("")
      : '<span class="muted">Aucune instance enregistrée.</span>';

    els.recentInstances.querySelectorAll("[data-recent-url]").forEach((button) => {
      button.addEventListener("click", () => {
        const url = button.getAttribute("data-recent-url") || "";
        const name = button.getAttribute("data-recent-name") || "";
        els.instanceUrl.value = url;
        els.instanceName.value = name;
        void saveInstance();
      });
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function render() {
    els.shellTitle.textContent = state.instanceName || "Console mobile";
    els.workspaceTitle.textContent = state.instanceName || "Operyx";
    els.workspaceSubtitle.textContent = state.instanceUrl || "Aucune instance chargee";
    els.instanceLabel.textContent = state.instanceName ? `${state.instanceName} / Android` : "Operyx / Android";
    els.shellPill.textContent = isNative() ? "Native" : "Web";
    els.printerPill.textContent = state.printer.name ? `Printer: ${state.printer.name}` : "Aucune imprimante";
    els.printerPill.className = `status-pill ${state.printer.name ? "good" : "warn"}`;
    els.networkPill.className = `status-pill ${navigator.onLine ? "good" : "warn"}`;
    els.networkPill.textContent = navigator.onLine ? "En ligne" : "Hors ligne";
    renderRecent();
    renderPrinters();
    syncInputs();
    renderNativeScreen(state.currentRoute);
  }

  function renderNativeScreen(route) {
    if (!els.nativeScreenGrid) return;
    const screen = getScreenPreset(route || "/");
    els.nativeScreenKicker.textContent = screen.kicker;
    els.nativeScreenTitle.textContent = screen.title;
    els.nativeScreenGrid.innerHTML = screen.cards
      .map(
        (card) => `
          <button class="native-card" data-native-route="${escapeHtml(card.route)}">
            <strong>${escapeHtml(card.title)}</strong>
            <span>${escapeHtml(card.description)}</span>
          </button>
        `,
      )
      .join("");
    els.nativeScreenGrid.querySelectorAll("[data-native-route]").forEach((button) => {
      button.addEventListener("click", () => navigate(button.getAttribute("data-native-route") || "/", false));
    });
    if (els.nativeScreen) {
      els.nativeScreen.classList.toggle("hidden", !state.instanceUrl);
    }
  }

  function getScreenPreset(route) {
    const normalized = route.startsWith("/") ? route : `/${route}`;
    if (normalized.startsWith("/planning")) {
      return {
        kicker: "Equipe mobile",
        title: "Planning et présence",
        cards: [
          { route: "/planning", title: "Ouvrir le planning", description: "Vue semaine et édition rapide." },
          { route: "/time-clock", title: "Aller à la badgeuse", description: "Pointage entrée ou sortie." },
          { route: "/team", title: "Voir l'équipe", description: "Employés, rôles et postes." },
          { route: "/settings", title: "Paramètres", description: "Horaires, droits et modules." },
        ],
      };
    }
    if (normalized.startsWith("/time-clock")) {
      return {
        kicker: "Badgeuse mobile",
        title: "Pointage rapide",
        cards: [
          { route: "/time-clock", title: "Entrée", description: "Pointer une arrivée." },
          { route: "/time-clock", title: "Sortie", description: "Pointer un départ." },
          { route: "/planning", title: "Planning du jour", description: "Vérifier les shifts prévus." },
          { route: "/notifications", title: "Alertes", description: "Consulter les rappels." },
        ],
      };
    }
    if (normalized.startsWith("/haccp") || normalized.startsWith("/temperatures")) {
      return {
        kicker: "Qualité mobile",
        title: "HACCP et températures",
        cards: [
          { route: "/haccp", title: "Tâches du jour", description: "Nettoyage, contrôle, validation." },
          { route: "/temperatures", title: "Températures", description: "Froid, chaud, relevés." },
          { route: "/labels", title: "Étiquettes", description: "DLC, lot et traçabilité." },
          { route: "/production", title: "Production", description: "Lots, sorties stock et suivi." },
        ],
      };
    }
    if (normalized.startsWith("/invoices")) {
      return {
        kicker: "Scan facture",
        title: "Capture et import mobile",
        cards: [
          { route: "/invoices", title: "Ouvrir les factures", description: "Importer et corriger." },
          { route: "/invoices", title: "Caméra facture", description: "Prendre une photo et l'envoyer." },
          { route: "/invoices", title: "Galerie", description: "Choisir un fichier existant." },
          { route: "/stock", title: "Relier au stock", description: "Après OCR, valider les lignes." },
        ],
      };
    }
    return {
      kicker: "Mode mobile",
      title: "Planning, badgeuse, HACCP",
      cards: [
        { route: "/planning", title: "Planning", description: "Ouvrir la semaine et les shifts." },
        { route: "/time-clock", title: "Badgeuse", description: "Entrée, sortie et corrections." },
        { route: "/haccp", title: "HACCP", description: "Nettoyage et contrôles." },
        { route: "/invoices", title: "Factures", description: "Caméra et import rapide." },
      ],
    };
  }

  async function saveInstance() {
    const nextUrl = normalizeUrl(els.instanceUrl.value);
    if (!nextUrl) {
      showToast("Indique une URL d'instance Operyx.");
      return;
    }
    const nextName = (els.instanceName.value || nextUrl.replace(/^https?:\/\//, "").split("/")[0]).trim();
    persistInstance(nextUrl, nextName);
    render();
    navigate("/", true);
    showToast(`Instance chargee: ${nextName}`);
  }

  function demoInstance() {
    els.instanceUrl.value = "https://demo.operyx.local";
    els.instanceName.value = "Operyx Demo";
    void saveInstance();
  }

  function navigate(route, replace = false) {
    if (!state.instanceUrl) return;
    const normalized = route.startsWith("/") ? route : `/${route}`;
    if (replace) {
      state.history = [normalized];
      state.historyIndex = 0;
      writeRouteToHash(normalized, true);
    } else {
      pushRoute(normalized, false);
    }
    openWorkspace(normalized, true);
    renderNativeScreen(normalized);
  }

  function openWorkspace(route, shouldFocusFrame) {
    if (!state.instanceUrl) return;
    state.currentRoute = route || "/";
    els.setupPanel.classList.add("hidden");
    els.workspace.classList.remove("hidden");
    els.shellTitle.textContent = state.instanceName || "Operyx";
    const target = currentFrameUrl();
    els.framePath.textContent = target;
    els.siteFrame.src = target;
    emitToSite({
      type: "operyx-mobile:navigation",
      route: state.currentRoute,
      target,
    });
    if (shouldFocusFrame) {
      closeDrawer();
    }
  }

  function openFullscreen() {
    if (!state.instanceUrl) return;
    window.location.href = currentFrameUrl();
  }

  function toggleDrawer() {
    els.drawer.classList.toggle("collapsed");
  }

  function closeDrawer() {
    els.drawer.classList.add("collapsed");
  }

  async function refreshNetwork() {
    if (!els.networkPill) return;
    els.networkPill.textContent = navigator.onLine ? "En ligne" : "Hors ligne";
    els.networkPill.className = `status-pill ${navigator.onLine ? "good" : "warn"}`;
    const network = plugin("Network");
    if (network?.getStatus) {
      try {
        const status = await network.getStatus();
        if (status?.connected !== undefined) {
          els.networkPill.textContent = status.connected ? "En ligne" : "Hors ligne";
          els.networkPill.className = `status-pill ${status.connected ? "good" : "warn"}`;
        }
      } catch {
        // fallback already handled
      }
    }
  }

  async function scanPrinters() {
    const nativePrinter = plugin("OperyxPrinter");
    if (!nativePrinter?.scanPrinters) {
      showToast("Scan Bluetooth disponible apres build Android natif.");
      return;
    }
    setDrawerBusy(true, "Scan Bluetooth...");
    try {
      const response = await nativePrinter.scanPrinters();
      state.printers = response.items || [];
      renderPrinters();
      showToast(state.printers.length ? `${state.printers.length} imprimante(s) detectee(s).` : "Aucune imprimante appairee detectee.");
    } catch (error) {
      showToast(error?.message || "Scan impossible");
    } finally {
      setDrawerBusy(false);
    }
  }

  function renderPrinters() {
    if (!els.printerList) return;
    const printers = state.printers || [];
    const activeTarget = state.printer.target;
    els.printerList.innerHTML = printers.length
      ? printers
          .map(
            (printer) => `
              <div class="printer-item ${printer.target === activeTarget ? "active" : ""}">
                <div>
                  <strong>${escapeHtml(printer.name || printer.target)}</strong>
                  <div><small>${escapeHtml(printer.target)}</small></div>
                </div>
                <button class="ghost tiny" data-printer-target="${escapeHtml(printer.target)}" data-printer-name="${escapeHtml(printer.name || printer.target)}">Choisir</button>
              </div>
            `,
          )
          .join("")
      : '<div class="muted">Lance un scan Bluetooth pour voir les imprimantes appairees.</div>';

    els.printerList.querySelectorAll("[data-printer-target]").forEach((button) => {
      button.addEventListener("click", () => {
        els.printerTarget.value = button.getAttribute("data-printer-target") || "";
        els.printerName.value = button.getAttribute("data-printer-name") || "";
        void savePrinter();
      });
    });
  }

  async function savePrinter() {
    const nextPrinter = {
      target: els.printerTarget.value.trim(),
      name: els.printerName.value.trim(),
      type: "bluetooth",
    };
    if (!nextPrinter.target) {
      showToast("Renseigne le target Bluetooth.");
      return;
    }
    persistPrinter(nextPrinter);
    render();
    const nativePrinter = plugin("OperyxPrinter");
    if (nativePrinter?.savePrinter) {
      try {
        await nativePrinter.savePrinter(nextPrinter);
      } catch {
        // local persistence already done
      }
    }
    showToast(`Imprimante enregistree: ${nextPrinter.name || nextPrinter.target}`);
  }

  async function testPrinter() {
    const nativePrinter = plugin("OperyxPrinter");
    if (!nativePrinter?.printTestLabel) {
      showToast("Test impression dispo apres build Android.");
      return;
    }
    if (!state.printer.target) {
      showToast("Choisis d'abord une imprimante.");
      return;
    }
    setDrawerBusy(true, "Impression test...");
    try {
      await nativePrinter.printTestLabel({
        target: state.printer.target,
        name: state.printer.name || "Operyx",
        label: {
          title: "DLC TEST",
          item_name: "Yogourt nature",
          batch_number: `OP-${Date.now().toString().slice(-6)}`,
          quantity: "1",
          unit: "piece",
          storage_area: "Froid",
          conservation_temperature: "0 C a 4 C",
          notes: "Etiquette test Operyx",
        },
      });
      showToast("Test imprime envoye.");
    } catch (error) {
      showToast(error?.message || "Test impression impossible");
    } finally {
      setDrawerBusy(false);
    }
  }

  async function shareCurrentRoute() {
    const url = currentFrameUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: state.instanceName || "Operyx",
          text: `Lien Operyx: ${url}`,
          url,
        });
        return;
      } catch {
        // continue to fallback
      }
    }
    await navigator.clipboard?.writeText?.(url);
    showToast("Lien copie.");
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      showToast("Notifications non supportees ici.");
      return;
    }
    const permission = await Notification.requestPermission();
    showToast(permission === "granted" ? "Notifications activees." : "Notifications refusees.");
  }

  function setDrawerBusy(busy, label) {
    if (busy) {
      els.printerPill.textContent = label || "Traitement...";
      els.printerPill.className = "status-pill warn";
    } else {
      render();
    }
  }

  function triggerFilePicker(input) {
    input.value = "";
    input.click();
  }

  async function onFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    state.selectedFile = file;
    els.filePreview.innerHTML = `
      <strong>${escapeHtml(file.name)}</strong><br />
      <small>${escapeHtml(file.type || "fichier")} - ${Math.round(file.size / 1024)} KB</small>
    `;
    const dataUrl = await readFileAsDataUrl(file);
    const payload = {
      type: "operyx-mobile:file-selected",
      fileName: file.name,
      fileType: file.type || "",
      fileSize: file.size,
      fileDataUrl: dataUrl,
      route: "/invoices",
      capturedAt: new Date().toISOString(),
    };
    emitToSite(payload);
    window.localStorage.setItem("operyx.android.pendingCapture", JSON.stringify(payload));
    if (state.currentRoute !== "/invoices") {
      navigate("/invoices", false);
    }
    showToast("Fichier pret. Le module d'upload sera branche sur le site.");
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Lecture fichier impossible"));
      reader.readAsDataURL(file);
    });
  }

  function emitToSite(payload) {
    try {
      els.siteFrame?.contentWindow?.postMessage(payload, "*");
    } catch {
      // ignore cross-origin issues
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 220);
    }, 2200);
    if (navigator.vibrate) {
      navigator.vibrate(12);
    } else {
      const haptics = plugin("Haptics");
      if (haptics?.impact) {
        haptics.impact({ style: "light" }).catch(() => {});
      }
    }
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
    }
  });

  void bootShell();
})();
