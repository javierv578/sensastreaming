/* ==========================================================================
   SENSASTREAMING — pantalla de carga (splash screen)
   Bloque independiente: si la página no tiene #splashScreen (catalogo.html,
   acerca-de.html) no hace nada. Dura 5 segundos exactos y luego se
   desvanece. La barra de progreso y la posición del stickman se calculan
   en el mismo requestAnimationFrame para que avancen siempre al mismo
   ritmo — así el "paso" queda sincronizado con la velocidad de carga.
   ========================================================================== */
(function () {
  "use strict";

  var splash = document.getElementById("splashScreen");
  if (!splash) return; // esta página no tiene splash screen

  var fill = document.getElementById("splashProgressFill");
  var track = document.getElementById("splashProgressTrack");
  var percentEl = document.getElementById("splashPercent");
  var stickman = document.getElementById("splashStickman");

  var DURATION = 5000; // 5 segundos exactos
  var STICKMAN_WIDTH = 22; // debe calzar con el ancho del stickman en el CSS
  var wrapWidth = 0;
  var startTime = null;
  var finished = false;

  document.documentElement.classList.add("splash-lock");

  function measure() {
    var wrap = stickman ? stickman.parentElement : null;
    wrapWidth = wrap ? wrap.clientWidth : 0;
  }

  function render(pct) {
    if (fill) fill.style.width = pct + "%";
    if (track) track.setAttribute("aria-valuenow", String(pct));
    if (percentEl) percentEl.textContent = pct + "%";
    if (stickman) {
      var maxLeft = Math.max(0, wrapWidth - STICKMAN_WIDTH);
      stickman.style.left = (maxLeft * (pct / 100)) + "px";
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    render(100);
    splash.classList.add("splash-hidden");
    document.documentElement.classList.remove("splash-lock");

    var removed = false;
    function remove() {
      if (removed) return;
      removed = true;
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }
    splash.addEventListener("transitionend", remove);
    setTimeout(remove, 900); // respaldo si transitionend no llega a disparar
  }

  function tick(now) {
    if (startTime === null) startTime = now;
    var elapsed = now - startTime;
    var pct = Math.min(100, Math.floor((elapsed / DURATION) * 100));
    render(pct);

    if (elapsed < DURATION) {
      requestAnimationFrame(tick);
    } else {
      finish();
    }
  }

  measure();
  window.addEventListener("resize", measure);
  requestAnimationFrame(tick);
})();

/* ==========================================================================
   SENSASTREAMING — buscador del header
   Estilo Netflix/Prime: al escribir se abre un mini-menú de resultados
   flotando debajo de la lupa. NO toca ni reordena las tarjetas de la
   página (por eso funciona igual en todas, incluidas las que no tienen
   catálogo, como Podcast o Acerca de).
   ========================================================================== */
(function () {
  "use strict";

  var searchWidget = document.getElementById("searchWidget");
  if (!searchWidget) return; // esta página no tiene buscador

  var toggleBtn = document.getElementById("searchToggle");
  var input = document.getElementById("searchInput");
  var resultsEl = document.getElementById("searchResults");

  // Catálogo propio del buscador: no depende de qué tarjetas haya en la
  // página actual, así el resultado es el mismo estés donde estés.
  var REPORTAJES = [
    { title: "¿Como llegar a la fama?", videoId: "hI8e6JMbuSg", image: "https://i.imgur.com/ZKIbFsF.jpeg" },
    { title: "¿Deporte o Sensasport?", videoId: "JzhlGWwWn6k", image: "https://i.imgur.com/p3X7n6U.jpeg" },
    { title: "¿Politica o Reality?", videoId: "DBuCfMrWrtk", image: "https://i.imgur.com/NYeV6bW.jpeg" },
    { title: "¿Influencers o creadores de estigmas?", videoId: "i1BO0bbKCyo", image: "https://i.imgur.com/RMKmTpX.jpeg" }
  ];

  function clearResults() {
    if (!resultsEl) return;
    resultsEl.innerHTML = "";
    searchWidget.classList.remove("has-query");
  }

  function renderResults(query) {
    if (!resultsEl) return;

    if (!query) {
      clearResults();
      return;
    }

    searchWidget.classList.add("has-query");
    resultsEl.innerHTML = "";

    var matches = REPORTAJES.filter(function (item) {
      return item.title.toLowerCase().indexOf(query) !== -1;
    });

    if (!matches.length) {
      var empty = document.createElement("p");
      empty.className = "search-results-empty";
      empty.textContent = "No se encontraron reportajes de ";
      var strong = document.createElement("strong");
      strong.textContent = input.value.trim();
      empty.appendChild(strong);
      resultsEl.appendChild(empty);
      return;
    }

    matches.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "search-result-item";
      a.href = "https://www.youtube.com/watch?v=" + item.videoId;
      a.target = "_blank";
      a.rel = "noopener";

      var img = document.createElement("img");
      img.className = "search-result-thumb";
      img.src = item.image;
      img.alt = "";
      img.loading = "lazy";

      var span = document.createElement("span");
      span.className = "search-result-title";
      span.textContent = item.title;

      a.appendChild(img);
      a.appendChild(span);
      a.addEventListener("click", closeSearch);
      resultsEl.appendChild(a);
    });
  }

  function openSearch() {
    searchWidget.classList.add("is-open");
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.setAttribute("aria-label", "Cerrar búsqueda");
    if (input) {
      // espera a que la transición de ancho arranque antes de enfocar
      setTimeout(function () { input.focus(); }, 50);
    }
  }

  function closeSearch() {
    searchWidget.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-label", "Buscar");
    if (input) input.blur();
    clearResults();
  }

  toggleBtn.addEventListener("click", function () {
    if (searchWidget.classList.contains("is-open")) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  if (input) {
    input.addEventListener("input", function () {
      renderResults(input.value.trim().toLowerCase());
    });
  }

  // Cierra al hacer click fuera del buscador
  document.addEventListener("click", function (e) {
    if (!searchWidget.contains(e.target)) closeSearch();
  });

  // Cierra con la tecla Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSearch();
  });
})();

/* ==========================================================================
   SENSASTREAMING — interactions
   Compartido por index.html, catalogo.html y acerca-de.html.
   Cada bloque revisa si sus elementos existen antes de engancharse, así el
   mismo archivo sirve para páginas que no tienen catálogo, tabs o reloj.

   - Header que se vuelve sólido al hacer scroll
   - Menú móvil
   - Reloj "EN VIVO" con la hora de Santiago de Chile (America/Santiago)
   - Tarjetas: hover (desktop) / tap (touch) / auto-preview centrado (mobile)
   - Tabs de filtro por categoría (reportajes.html)
   - Buscador del header: mini-menú de resultados, no filtra la página
   ========================================================================== */

(function () {
  "use strict";

  var header = document.getElementById("siteHeader");
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  var row = document.getElementById("cardRow");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var PREVIEW_DELAY = 500; // ms antes de cargar el adelanto

  /* ---------------------------------------------------------------------
     Header: fondo sólido apenas se hace scroll
     --------------------------------------------------------------------- */
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  if (header) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------------
     Menú móvil
     --------------------------------------------------------------------- */
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = siteNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        siteNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------------------
     Reloj "EN VIVO" — hora de Santiago de Chile
     Usa el IANA timezone "America/Santiago", así el offset (UTC-3 / UTC-4)
     se resuelve solo según la fecha, sin tener que calcular el horario de
     verano a mano.
     --------------------------------------------------------------------- */
  function initLiveClock() {
    var timeEl = document.getElementById("liveClockTime");
    var offsetEl = document.getElementById("liveClockOffset");
    if (!timeEl) return;

    var timeFormatter = new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    var offsetFormatter = null;
    try {
      offsetFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Santiago",
        timeZoneName: "shortOffset"
      });
    } catch (err) {
      offsetFormatter = null; // navegador sin soporte para "shortOffset"
    }

    function getOffsetLabel(date) {
      if (!offsetFormatter) return "";
      var parts = offsetFormatter.formatToParts(date);
      var tzPart = parts.filter(function (p) { return p.type === "timeZoneName"; })[0];
      return tzPart ? tzPart.value.replace("GMT", "UTC") : "";
    }

    function tick() {
      var now = new Date();
      timeEl.textContent = timeFormatter.format(now);
      if (offsetEl) offsetEl.textContent = getOffsetLabel(now);
    }

    tick();
    setInterval(tick, 1000);
  }
  initLiveClock();

  /* ---------------------------------------------------------------------
     Lógica de preview de tarjetas
     --------------------------------------------------------------------- */
  function buildEmbedUrl(id) {
    return "https://www.youtube.com/embed/" + id +
      "?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1" +
      "&loop=1&playlist=" + id;
  }

  function activate(card) {
    if (card.classList.contains("active")) return;
    cards.forEach(function (c) { if (c !== card) deactivate(c); });
    card.classList.add("active");

    if (prefersReducedMotion) return; // solo texto/scrim, sin video

    clearTimeout(card._previewTimer);
    card._previewTimer = setTimeout(function () {
      if (!card.classList.contains("active")) return;
      var media = card.querySelector(".card-media");
      if (media.querySelector("iframe")) return;

      var id = card.getAttribute("data-yt");
      var iframe = document.createElement("iframe");
      iframe.src = buildEmbedUrl(id);
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      iframe.setAttribute("tabindex", "-1");
      iframe.setAttribute("title", "Adelanto");
      iframe.addEventListener("load", function () {
        iframe.classList.add("loaded");
      });
      media.appendChild(iframe);
    }, PREVIEW_DELAY);
  }

  function deactivate(card) {
    clearTimeout(card._previewTimer);
    card.classList.remove("active");
    var iframe = card.querySelector(".card-media iframe");
    if (iframe) iframe.remove();
  }

  function openCard(card) {
    var id = card.getAttribute("data-yt");
    window.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener");
  }

  cards.forEach(function (card) {
    // Desktop: hover real + foco de teclado
    if (hasHover) {
      card.addEventListener("mouseenter", function () { activate(card); });
      card.addEventListener("mouseleave", function () { deactivate(card); });
      card.addEventListener("focus", function () { activate(card); });
      card.addEventListener("blur", function () { deactivate(card); });
    }

    // Click / tap en una tarjeta ya activa abre el video.
    // En una tarjeta aún no activa (touch, o un click que le ganó al hover)
    // solo dispara el preview.
    card.addEventListener("click", function (e) {
      if (e.target.closest(".play-btn")) return; // el link hace lo suyo
      if (card.classList.contains("active")) {
        openCard(card);
      } else {
        e.preventDefault();
        activate(card);
      }
    });

    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (card.classList.contains("active")) openCard(card);
        else activate(card);
      } else if (e.key === "Escape") {
        deactivate(card);
        card.blur();
      }
    });
  });

  // Cierra el preview abierto al hacer click/tap fuera de la fila
  document.addEventListener("click", function (e) {
    if (!row || row.contains(e.target)) return;
    cards.forEach(deactivate);
  });

  /* ---------------------------------------------------------------------
     Touch: mientras se desliza la fila, la tarjeta centrada se
     previsualiza sola — refleja "deslizar para ver un adelanto"
     --------------------------------------------------------------------- */
  if (row && !hasHover && "IntersectionObserver" in window) {
    var centerObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.65) {
            activate(entry.target);
          } else {
            deactivate(entry.target);
          }
        });
      },
      { root: row, threshold: [0, 0.65, 1], rootMargin: "0px -20% 0px -20%" }
    );
    cards.forEach(function (card) { centerObserver.observe(card); });
  }

  /* ---------------------------------------------------------------------
     Tabs de filtro por categoría (reportajes.html). El buscador del
     header ya NO pasa por acá: ahora abre su propio mini-menú de
     resultados en vez de reordenar estas tarjetas.
     --------------------------------------------------------------------- */
  var filterTabs = Array.prototype.slice.call(document.querySelectorAll(".filter-tab"));

  if (filterTabs.length && cards.length) {
    filterTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var filter = tab.getAttribute("data-filter");

        filterTabs.forEach(function (t) {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        cards.forEach(function (card) {
          var matches = filter === "todos" || card.getAttribute("data-category") === filter;
          card.classList.toggle("filtered-out", !matches);
          if (!matches) deactivate(card);
        });
      });
    });
  }
})();
