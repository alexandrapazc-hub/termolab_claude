/* =========================================================
   TermoConversor - lógica de la aplicación
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Datos de las escalas ---------- */
  var SCALES = {
    C: { name: "Celsius", symbol: "°C", min: -273.15 },
    K: { name: "Kelvin", symbol: "K", min: 0 },
    F: { name: "Fahrenheit", symbol: "°F", min: -459.67 },
    R: { name: "Rankine", symbol: "°R", min: 0 }
  };

  var MAX_ABS_VALUE = 1e12;
  var HISTORY_LIMIT = 10;
  var HISTORY_KEY = "termoconversor-historial";
  var THEME_KEY = "termoconversor-tema";

  /* ---------- Conversiones ---------- */
  // Se convierte primero a Celsius y luego a la escala de destino.
  function toCelsius(value, scale) {
    switch (scale) {
      case "C": return value;
      case "K": return value - 273.15;
      case "F": return (value - 32) * 5 / 9;
      case "R": return (value * 5 / 9) - 273.15;
      default: throw new Error("Escala desconocida: " + scale);
    }
  }

  function fromCelsius(celsius, scale) {
    switch (scale) {
      case "C": return celsius;
      case "K": return celsius + 273.15;
      case "F": return (celsius * 9 / 5) + 32;
      case "R": return (celsius + 273.15) * 9 / 5;
      default: throw new Error("Escala desconocida: " + scale);
    }
  }

  // Elimina el ruido de coma flotante (p. ej. 273.15000000000003).
  function clean(n) {
    var r = Math.round(n * 1e10) / 1e10;
    return Object.is(r, -0) ? 0 : r;
  }

  function convert(value, from, to) {
    if (from === to) return value;
    return clean(fromCelsius(toCelsius(value, from), to));
  }

  /* ---------- Fórmulas mostradas ---------- */
  // Cada fórmula: texto y función que construye la sustitución con el valor.
  var FORMULAS = {
    "C>K": { text: "K = °C + 273.15", step: function (v) { return v + " + 273.15"; } },
    "C>F": { text: "°F = (°C × 9/5) + 32", step: function (v) { return "(" + v + " × 9/5) + 32"; } },
    "C>R": { text: "°R = (°C + 273.15) × 9/5", step: function (v) { return "(" + v + " + 273.15) × 9/5"; } },
    "K>C": { text: "°C = K − 273.15", step: function (v) { return v + " − 273.15"; } },
    "K>F": { text: "°F = (K × 9/5) − 459.67", step: function (v) { return "(" + v + " × 9/5) − 459.67"; } },
    "K>R": { text: "°R = K × 9/5", step: function (v) { return v + " × 9/5"; } },
    "F>C": { text: "°C = (°F − 32) × 5/9", step: function (v) { return "(" + v + " − 32) × 5/9"; } },
    "F>K": { text: "K = (°F + 459.67) × 5/9", step: function (v) { return "(" + v + " + 459.67) × 5/9"; } },
    "F>R": { text: "°R = °F + 459.67", step: function (v) { return v + " + 459.67"; } },
    "R>C": { text: "°C = (°R × 5/9) − 273.15", step: function (v) { return "(" + v + " × 5/9) − 273.15"; } },
    "R>K": { text: "K = °R × 5/9", step: function (v) { return v + " × 5/9"; } },
    "R>F": { text: "°F = °R − 459.67", step: function (v) { return v + " − 459.67"; } }
  };

  function getFormula(from, to) {
    if (from === to) {
      var s = SCALES[from].symbol;
      return { text: s + " = " + s + " (misma escala, el valor no cambia)", step: function (v) { return v; } };
    }
    return FORMULAS[from + ">" + to];
  }

  /* ---------- Utilidades ---------- */
  function $(id) { return document.getElementById(id); }

  function formatNumber(n, decimals) {
    var txt = Number(n).toFixed(decimals);
    // Evita mostrar "-0.00"
    if (/^-0(\.0+)?$/.test(txt)) txt = txt.substring(1);
    return txt;
  }

  function formatTemp(n, scale, decimals) {
    return formatNumber(n, decimals) + " " + SCALES[scale].symbol;
  }

  // Muestra el valor ingresado tal cual lo entiende la app (sin ceros innecesarios).
  function formatInput(n) {
    var r = clean(n);
    return String(r).indexOf("e") === -1 ? String(r) : r.toPrecision(10);
  }

  function parseInput(raw) {
    var txt = String(raw).trim().replace(/\s+/g, "").replace(",", ".");
    if (txt === "") return { empty: true };
    if (txt === "-" || txt === "+" || txt === "." || txt === "-." || txt === "+.") {
      return { error: "Escribe un número completo, por ejemplo -12.5." };
    }
    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(txt)) {
      return { error: "El valor ingresado no es un número válido. Usa solo dígitos, signo y punto o coma decimal." };
    }
    var value = Number(txt);
    if (!isFinite(value)) return { error: "El número es demasiado grande para convertirse." };
    if (Math.abs(value) > MAX_ABS_VALUE) {
      return { error: "Ingresa un valor entre −1 000 000 000 000 y 1 000 000 000 000." };
    }
    return { value: value };
  }

  function getZone(celsius) {
    if (celsius < 10) return "cold";
    if (celsius <= 30) return "mild";
    return "hot";
  }

  var ZONE_INFO = {
    cold: { icon: "❄︎", label: "Frío", desc: "Por debajo de 10 °C. Temperaturas propias de climas fríos, refrigeración o congelación." },
    mild: { icon: "◐", label: "Templado", desc: "Entre 10 °C y 30 °C. Rango agradable, cercano a la temperatura ambiente." },
    hot: { icon: "☀︎", label: "Caliente", desc: "Por encima de 30 °C. Climas cálidos, fiebre, cocción o procesos industriales." },
    neutral: { icon: "◌", label: "Sin datos", desc: "El color del indicador cambia según la temperatura: azul para frío, verde para templado y rojo para caliente." }
  };

  /* ---------- Referencias al DOM ---------- */
  var els = {};
  var state = {
    last: null,          // última conversión válida
    history: [],
    historyTimer: null,
    toastTimer: null
  };

  function cacheElements() {
    [
      "converterForm", "tempInput", "inputUnit", "minValue", "inputError",
      "fromScale", "toScale", "decimals", "autoConvert", "swapBtn", "clearBtn",
      "resultBox", "resultValue", "resultDetail", "copyBtn", "copyLabel",
      "formulaText", "formulaSteps", "thermometer", "thermoFill", "zoneBadge",
      "zoneIcon", "zoneText", "zoneDesc", "equivList", "historyList",
      "historyEmpty", "clearHistoryBtn", "themeToggle", "toast", "tryExampleBtn"
    ].forEach(function (id) { els[id] = $(id); });
  }

  /* ---------- Interfaz: estados ---------- */
  function updateScaleHints() {
    var from = els.fromScale.value;
    els.inputUnit.textContent = SCALES[from].symbol;
    els.minValue.textContent = formatInput(SCALES[from].min) + " " + SCALES[from].symbol + " (cero absoluto)";
    els.tempInput.setAttribute("aria-label", "Temperatura en " + SCALES[from].name);
  }

  function showError(message) {
    els.inputError.textContent = message;
    els.tempInput.setAttribute("aria-invalid", "true");
    els.resultBox.setAttribute("data-zone", "error");
    els.resultValue.textContent = "—";
    els.resultDetail.textContent = "Corrige el valor para ver el resultado.";
    els.copyBtn.disabled = true;
    state.last = null;
    resetIndicator();
    updateFormula(null);
  }

  function clearError() {
    els.inputError.textContent = "";
    els.tempInput.removeAttribute("aria-invalid");
  }

  function resetResult() {
    clearError();
    state.last = null;
    els.resultBox.setAttribute("data-zone", "neutral");
    els.resultValue.textContent = "—";
    els.resultDetail.textContent = "Ingresa una temperatura para ver la conversión.";
    els.copyBtn.disabled = true;
    resetIndicator();
    updateFormula(null);
  }

  function resetIndicator() {
    els.thermometer.setAttribute("data-zone", "neutral");
    els.thermometer.setAttribute("aria-label", "Termómetro sin valor");
    els.thermoFill.style.height = "0%";
    setZoneBadge("neutral");
    var items = els.equivList.querySelectorAll("strong");
    Array.prototype.forEach.call(items, function (item) { item.textContent = "—"; });
    markTargetEquivalence();
  }

  function setZoneBadge(zone) {
    var info = ZONE_INFO[zone];
    els.zoneBadge.setAttribute("data-zone", zone);
    els.zoneIcon.textContent = info.icon;
    els.zoneText.textContent = info.label;
    els.zoneDesc.textContent = info.desc;
  }

  function markTargetEquivalence() {
    var to = els.toScale.value;
    var items = els.equivList.querySelectorAll("li");
    Array.prototype.forEach.call(items, function (li) {
      var strong = li.querySelector("strong");
      li.classList.toggle("is-target", strong.getAttribute("data-scale") === to);
    });
  }

  function updateFormula(data) {
    var from = els.fromScale.value;
    var to = els.toScale.value;
    var f = getFormula(from, to);
    els.formulaText.textContent = f.text;
    if (data) {
      els.formulaSteps.textContent = SCALES[to].symbol + " = " + f.step(formatInput(data.value)) +
        " = " + formatNumber(data.result, data.decimals) + " " + SCALES[to].symbol;
    } else {
      els.formulaSteps.textContent = "";
    }
  }

  function updateIndicator(celsius, decimals) {
    var zone = getZone(celsius);
    // El tubo representa de -50 °C a 150 °C.
    var pct = ((celsius + 50) / 200) * 100;
    pct = Math.max(0, Math.min(100, pct));
    els.thermometer.setAttribute("data-zone", zone);
    els.thermometer.setAttribute("aria-label", "Termómetro: " + formatNumber(celsius, decimals) + " grados Celsius, " + ZONE_INFO[zone].label.toLowerCase());
    els.thermoFill.style.height = pct + "%";
    setZoneBadge(zone);
    return zone;
  }

  function updateEquivalences(celsius, decimals) {
    var items = els.equivList.querySelectorAll("strong");
    Array.prototype.forEach.call(items, function (item) {
      var scale = item.getAttribute("data-scale");
      item.textContent = formatTemp(clean(fromCelsius(celsius, scale)), scale, decimals);
    });
    markTargetEquivalence();
  }

  /* ---------- Conversión principal ---------- */
  // mode: "auto" (mientras se escribe) o "manual" (botón / Enter)
  function runConversion(mode) {
    var from = els.fromScale.value;
    var to = els.toScale.value;
    var decimals = parseInt(els.decimals.value, 10);
    var parsed = parseInput(els.tempInput.value);

    updateScaleHints();

    if (parsed.empty) {
      resetResult();
      updateFormula(null);
      if (mode === "manual") {
        showError("Ingresa una temperatura para convertir.");
        els.tempInput.focus();
      }
      return null;
    }

    if (parsed.error) {
      showError(parsed.error);
      return null;
    }

    var value = parsed.value;
    var min = SCALES[from].min;
    if (value < min) {
      showError("No es posible: " + formatInput(value) + " " + SCALES[from].symbol +
        " está por debajo del cero absoluto (" + formatInput(min) + " " + SCALES[from].symbol + ").");
      return null;
    }

    clearError();

    var result = convert(value, from, to);
    var celsius = clean(toCelsius(value, from));
    var resultText = formatTemp(result, to, decimals);

    state.last = { value: value, from: from, to: to, result: result, decimals: decimals, text: resultText, celsius: celsius };

    var zone = updateIndicator(celsius, decimals);
    els.resultBox.setAttribute("data-zone", zone);
    els.resultValue.textContent = resultText;
    els.resultValue.classList.remove("pop");
    void els.resultValue.offsetWidth; // reinicia la animación
    els.resultValue.classList.add("pop");

    var detail = formatInput(value) + " " + SCALES[from].symbol + " (" + SCALES[from].name + ") equivale a " +
      resultText + " (" + SCALES[to].name + ").";
    if (from === to) detail += " Al ser la misma escala, el valor no cambia.";
    if (value === min) detail += " Este valor corresponde al cero absoluto.";
    els.resultDetail.textContent = detail;
    els.copyBtn.disabled = false;

    updateFormula(state.last);
    updateEquivalences(celsius, decimals);

    if (mode === "manual") {
      addToHistory(state.last);
    } else {
      scheduleHistory();
    }
    return state.last;
  }

  /* ---------- Historial ---------- */
  function scheduleHistory() {
    clearTimeout(state.historyTimer);
    state.historyTimer = setTimeout(function () {
      if (state.last) addToHistory(state.last);
    }, 1200);
  }

  function addToHistory(entry) {
    clearTimeout(state.historyTimer);
    var first = state.history[0];
    if (first && first.value === entry.value && first.from === entry.from &&
        first.to === entry.to && first.decimals === entry.decimals) {
      return;
    }
    state.history.unshift({
      value: entry.value,
      from: entry.from,
      to: entry.to,
      decimals: entry.decimals,
      text: entry.text,
      celsius: entry.celsius,
      time: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    });
    if (state.history.length > HISTORY_LIMIT) state.history.length = HISTORY_LIMIT;
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    els.historyList.innerHTML = "";
    state.history.forEach(function (h) {
      var li = document.createElement("li");
      li.className = "history-item";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "history-btn";
      var label = formatInput(h.value) + " " + SCALES[h.from].symbol + " = " + h.text;
      btn.setAttribute("aria-label", "Cargar conversión: " + label);

      var dot = document.createElement("span");
      dot.className = "history-dot";
      dot.setAttribute("data-zone", getZone(h.celsius));
      dot.setAttribute("aria-hidden", "true");

      var text = document.createElement("span");
      text.className = "history-text";
      var strong = document.createElement("strong");
      strong.textContent = label;
      var small = document.createElement("small");
      small.textContent = SCALES[h.from].name + " → " + SCALES[h.to].name + " · " + h.time;
      text.appendChild(strong);
      text.appendChild(small);

      btn.appendChild(dot);
      btn.appendChild(text);
      btn.addEventListener("click", function () { loadFromHistory(h); });

      li.appendChild(btn);
      els.historyList.appendChild(li);
    });

    var empty = state.history.length === 0;
    els.historyEmpty.hidden = !empty;
    els.clearHistoryBtn.disabled = empty;
  }

  function loadFromHistory(h) {
    els.tempInput.value = formatInput(h.value);
    els.fromScale.value = h.from;
    els.toScale.value = h.to;
    els.decimals.value = String(h.decimals);
    runConversion("auto");
    clearTimeout(state.historyTimer);
    els.tempInput.focus();
    showToast("Conversión cargada desde el historial");
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    } catch (e) { /* almacenamiento no disponible: el historial queda en memoria */ }
  }

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(HISTORY_KEY);
      var data = raw ? JSON.parse(raw) : [];
      if (Array.isArray(data)) {
        state.history = data.filter(function (h) {
          return h && SCALES[h.from] && SCALES[h.to] && typeof h.value === "number" && typeof h.text === "string";
        }).slice(0, HISTORY_LIMIT);
      }
    } catch (e) {
      state.history = [];
    }
  }

  /* ---------- Portapapeles ---------- */
  function copyResult() {
    if (!state.last) return;
    var text = state.last.text;

    function done(ok) {
      if (ok) {
        els.copyLabel.textContent = "¡Copiado!";
        showToast("Resultado copiado: " + text);
        setTimeout(function () { els.copyLabel.textContent = "Copiar resultado"; }, 1600);
      } else {
        showToast("No se pudo copiar. Selecciona el resultado y cópialo manualmente.");
      }
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    els.copyBtn.focus();
    return ok;
  }

  /* ---------- Notificaciones ---------- */
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () { els.toast.classList.remove("show"); }, 2200);
  }

  /* ---------- Tema ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var dark = theme === "dark";
    els.themeToggle.setAttribute("aria-pressed", String(dark));
    els.themeToggle.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved === "dark" || saved === "light" ? saved : (prefersDark ? "dark" : "light"));
  }

  function toggleTheme() {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* sin almacenamiento */ }
  }

  /* ---------- Acciones ---------- */
  function swapScales() {
    var from = els.fromScale.value;
    els.fromScale.value = els.toScale.value;
    els.toScale.value = from;

    // Si hay un resultado válido, se usa como nuevo valor de entrada.
    if (state.last) {
      els.tempInput.value = formatInput(state.last.result);
    }
    els.swapBtn.classList.remove("spin");
    void els.swapBtn.offsetWidth;
    els.swapBtn.classList.add("spin");
    runConversion("auto");
  }

  function clearAll() {
    clearTimeout(state.historyTimer);
    els.tempInput.value = "";
    resetResult();
    updateScaleHints();
    els.tempInput.focus();
  }

  /* ---------- Eventos ---------- */
  function bindEvents() {
    els.converterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      runConversion("manual");
    });

    els.tempInput.addEventListener("input", function () {
      if (els.autoConvert.checked) {
        runConversion("auto");
      } else {
        clearError();
      }
    });

    els.tempInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        clearAll();
      }
    });

    [els.fromScale, els.toScale, els.decimals].forEach(function (sel) {
      sel.addEventListener("change", function () {
        updateScaleHints();
        markTargetEquivalence();
        if (els.tempInput.value.trim() !== "" && (els.autoConvert.checked || state.last)) {
          runConversion("auto");
        } else {
          updateFormula(null);
        }
      });
    });

    els.swapBtn.addEventListener("click", swapScales);
    els.clearBtn.addEventListener("click", clearAll);
    els.copyBtn.addEventListener("click", copyResult);
    els.themeToggle.addEventListener("click", toggleTheme);

    els.clearHistoryBtn.addEventListener("click", function () {
      state.history = [];
      saveHistory();
      renderHistory();
      showToast("Historial borrado");
    });

    els.tryExampleBtn.addEventListener("click", function () {
      els.tempInput.value = "37";
      els.fromScale.value = "C";
      els.toScale.value = "F";
      els.decimals.value = "2";
      runConversion("manual");
      document.getElementById("conversor").scrollIntoView({ behavior: "smooth", block: "start" });
      els.tempInput.focus({ preventScroll: true });
    });
  }

  /* ---------- Inicio ---------- */
  function init() {
    cacheElements();
    initTheme();
    loadHistory();
    bindEvents();
    updateScaleHints();
    resetResult();
    renderHistory();
  }

  // Expuesto solo para pruebas desde la consola.
  window.TermoConversor = { convert: convert, toCelsius: toCelsius, fromCelsius: fromCelsius, SCALES: SCALES };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
