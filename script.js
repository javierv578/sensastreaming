/* ==========================================================================
   SENSASTREAMING — modo app (iOS / Capacitor / "Agregar a inicio")
   Detecta si el sitio corre como app y activa solo ahí los ajustes de app.
   En la web normal no cambia nada.
   ========================================================================== */
(function () {
  "use strict";

  var cap = window.Capacitor;
  var isNative = !!(cap && (typeof cap.isNativePlatform === "function" ? cap.isNativePlatform() : cap.platform && cap.platform !== "web"));
  var isStandalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);

  if (!isNative && !isStandalone) return;

  window.SENSA_IS_APP = true;
  document.documentElement.classList.add("is-app");

  // Los enlaces que abren fuera del sitio (YouTube) salen por el navegador
  // nativo del sistema si el plugin @capacitor/browser está instalado.
  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest('a[target="_blank"]') : null;
    if (!link) return;
    var browser = cap && cap.Plugins && cap.Plugins.Browser;
    if (browser && typeof browser.open === "function") {
      e.preventDefault();
      browser.open({ url: link.href });
    }
  });
})();

/* ==========================================================================
   Hero — carrusel de fondo (solo anima #heroSlider; no toca el contenido frontal)
   Cambia cada 10 s con fundido + deslizamiento suave hacia la derecha.
   ========================================================================== */
(function () {
  "use strict";

  var slider = document.getElementById("heroSlider");
  if (!slider) return;

  var urls = (slider.getAttribute("data-slides") || "").split("|").filter(Boolean);
  if (!urls.length) return;

  var INTERVAL = 10000; // 10 segundos
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var slides = urls.map(function (url, i) {
    var el = document.createElement("div");
    el.className = "hero-slide" + (i === 0 ? " is-active" : "");
    el.style.backgroundImage = "url('" + url + "')";
    slider.appendChild(el);
    return el;
  });

  if (slides.length < 2 || reduce) return;

  // Precarga para evitar parpadeos al cambiar
  urls.slice(1).forEach(function (u) { var im = new Image(); im.src = u; });

  var index = 0;
  var timer = null;

  function next() {
    var current = slides[index];
    index = (index + 1) % slides.length;
    var incoming = slides[index];
    current.classList.remove("is-active");
    incoming.classList.add("is-active");
  }

  function start() { if (!timer) timer = setInterval(next, INTERVAL); }
  function stop() { clearInterval(timer); timer = null; }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  start();
})();

/* ==========================================================================
   SENSASTREAMING — pantalla de carga (splash screen)
   Bloque independiente: si la página no tiene #splashScreen (reportajes.html,
   acerca-de.html) no hace nada. Dura 4 segundos exactos y luego se
   desvanece. La barra de progreso y la posición del stickman se calculan
   en el mismo requestAnimationFrame para que avancen siempre al mismo
   ritmo — así el "paso" queda sincronizado con la velocidad de carga.
   ========================================================================== */
(function () {
  "use strict";

  var splash = document.getElementById("splashScreen");
  if (!splash) return; // esta página no tiene splash screen

  // En modo app, la pantalla de carga se muestra una vez por sesión
  // (no cada vez que se vuelve a "Inicio"). En la web no cambia nada.
  if (window.SENSA_IS_APP) {
    try {
      if (window.sessionStorage.getItem("sensa-splash-seen")) {
        splash.parentNode.removeChild(splash);
        return;
      }
      window.sessionStorage.setItem("sensa-splash-seen", "1");
    } catch (err) { /* sin sessionStorage: se muestra normal */ }
  }

  var fill = document.getElementById("splashProgressFill");
  var track = document.getElementById("splashProgressTrack");
  var percentEl = document.getElementById("splashPercent");
  var stickman = document.getElementById("splashStickman");

  var DURATION = 4000; // 4 segundos exactos
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
    { title: "El riesgo de limitar al periodismo", videoUrl: "https://pub-4d9078245ee945288b7001a9b6d5394e.r2.dev/FINAL%20MORDAZA%20CON%20HGC.mp4", image: "https://i.imgur.com/goQDQQN.jpeg", detailUrl: "detalle-fama.html" },
    { title: "Fuera de los 90 minutos", videoUrl: "https://pub-4d9078245ee945288b7001a9b6d5394e.r2.dev/FINAL%20DEPORTES%20AHORA%20SI%20QUE%20SI.mp4", image: "https://i.imgur.com/lAsv4dQ.jpeg", detailUrl: "detalle-deporte.html" },
    { title: "El Cangri: un crimen que se convirtió en meme", videoUrl: "https://pub-4d9078245ee945288b7001a9b6d5394e.r2.dev/CANGRI%20FINAL%20DEFINITIVO%204K%20SIN%20HACKS.mp4", image: "https://i.imgur.com/Mluwtng.jpeg", detailUrl: "detalle-politica.html" },
    { title: "Influencer: El precio de la viralidad", videoUrl: "https://pub-4d9078245ee945288b7001a9b6d5394e.r2.dev/INFLUENCERS%20FINAL%20GC.mp4", image: "https://i.imgur.com/LVwCR66.jpeg", detailUrl: "detalle-influencers.html" }
  ];

  function clearResults() {
    if (!resultsEl) return;
    resultsEl.innerHTML = "";
    searchWidget.classList.remove("has-query");
  }

  function normalize(str) {
    // saca tildes/diacríticos para que buscar "como" también encuentre "Cómo"
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function renderResults(query) {
    if (!resultsEl) return;

    if (!query) {
      clearResults();
      return;
    }

    searchWidget.classList.add("has-query");
    resultsEl.innerHTML = "";

    var normalizedQuery = normalize(query);
    var matches = REPORTAJES.filter(function (item) {
      return normalize(item.title).indexOf(normalizedQuery) !== -1;
    });

    if (!matches.length) {
      var empty = document.createElement("p");
      empty.className = "search-results-empty";
      empty.textContent = "No se encontraron documentales de ";
      var strong = document.createElement("strong");
      strong.textContent = input.value.trim();
      empty.appendChild(strong);
      resultsEl.appendChild(empty);
      return;
    }

    matches.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "search-result-item";
      a.href = item.detailUrl;

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
      renderResults(input.value.trim());
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
   SENSASTREAMING — mini-menú de categorías (header)
   Mismo patrón que el buscador: abre/cierra un dropdown flotante. Cada
   opción es un link normal a reportajes.html?categoria=X, así funciona
   incluso sin JS. Reportajes.html además lee ese parámetro al cargar
   para dejar el tab correspondiente ya activo (ver bloque de abajo).
   ========================================================================== */
(function () {
  "use strict";

  var widget = document.getElementById("categoriesWidget");
  if (!widget) return; // esta página no tiene el ícono de categorías

  var toggleBtn = document.getElementById("categoriesToggle");

  function openMenu() {
    widget.classList.add("is-open");
    toggleBtn.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    widget.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  toggleBtn.addEventListener("click", function () {
    if (widget.classList.contains("is-open")) closeMenu();
    else openMenu();
  });

  document.addEventListener("click", function (e) {
    if (!widget.contains(e.target)) closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });
})();

/* ==========================================================================
   SENSASTREAMING — interactions
   Compartido por index.html, reportajes.html, acerca-de.html y podcast.html.
   Cada bloque revisa si sus elementos existen antes de engancharse, así el
   mismo archivo sirve para páginas que no tienen catálogo, tabs o reloj.

   - Header que se vuelve sólido al hacer scroll
   - Menú móvil
   - Reloj "EN VIVO" con la hora de Santiago de Chile (America/Santiago)
   - Tarjetas: hover (desktop) / tap (touch) / auto-preview centrado (mobile)
   - Tabs de filtro por categoría (reportajes.html), incluida la que llega
     por ?categoria= desde el mini-menú del header
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

    // sin video: movimiento reducido, o si la app define window.SENSA_DISABLE_PREVIEWS = true
    // (útil si YouTube rechaza los embeds dentro del WebView de iOS)
    if (prefersReducedMotion || window.SENSA_DISABLE_PREVIEWS) return;

    clearTimeout(card._previewTimer);
    card._previewTimer = setTimeout(function () {
      if (!card.classList.contains("active")) return;
      var media = card.querySelector(".card-media");
      if (media.querySelector("iframe, video")) return;

      // Adelanto con MP4 propio: mismo flujo que el iframe (silencio, bucle, fade-in con .loaded)
      var mp4 = card.getAttribute("data-mp4");
      if (mp4) {
        var vid = document.createElement("video");
        vid.src = mp4;
        vid.muted = true;
        vid.loop = true;
        vid.autoplay = true;
        vid.setAttribute("playsinline", "");
        vid.setAttribute("preload", "metadata");
        vid.setAttribute("tabindex", "-1");
        vid.setAttribute("aria-hidden", "true");
        vid.addEventListener("playing", function () { vid.classList.add("loaded"); });
        media.appendChild(vid);
        var pr = vid.play();
        if (pr && pr.catch) pr.catch(function () {});
        return;
      }
      var id = card.getAttribute("data-yt");
      if (!id) return;
      var iframe = document.createElement("iframe");
      iframe.src = buildEmbedUrl(id);
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      // YouTube exige referrer en los embeds; sin esto falla dentro de un WebView
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
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
    var iframe = card.querySelector(".card-media iframe, .card-media video");
    if (iframe) iframe.remove();
  }

  function openCard(card) {
    var detailUrl = card.getAttribute("data-detail");
    if (detailUrl) window.location.href = detailUrl;
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

    // Si se llegó desde el mini-menú "Categorías" del header
    // (reportajes.html?categoria=judicial), deja ese tab ya activo.
    var requestedCategory = new URLSearchParams(window.location.search).get("categoria");
    if (requestedCategory) {
      var matchingTab = filterTabs.filter(function (t) {
        return t.getAttribute("data-filter") === requestedCategory;
      })[0];
      if (matchingTab) matchingTab.click();
    }
  }
})();

/* ==========================================================================
   SENSASTREAMING — easter egg: minijuego "esquiva el televisor"
   Estilo Dino de Chrome. El jugador es el mismo stickman del splash screen
   (misma cabeza carmesí, mismo cuerpo/piernas, misma animación de piernas).
   Bloque independiente y guardado: si la página no tiene el trigger del
   footer o el overlay del juego, no hace nada.
   ========================================================================== */
(function () {
  "use strict";

  var trigger = document.getElementById("easterEggTrigger");
  var overlay = document.getElementById("gameOverlay");
  if (!trigger || !overlay) return; // esta página no tiene el juego

  var closeBtn = document.getElementById("gameClose");
  var stage = document.getElementById("gameStage");
  var player = document.getElementById("gamePlayer");
  var scoreEl = document.getElementById("gameScore");
  var messageEl = document.getElementById("gameMessage");

  var gameOverEl = document.getElementById("gameOver");
  var gameOverScoreEl = document.getElementById("gameOverScore");
  var gameOverStatusEl = document.getElementById("gameOverStatus");
  var initialsForm = document.getElementById("gameInitialsForm");
  var initialsInput = document.getElementById("gameInitialsInput");
  var scoreboardEl = document.getElementById("gameScoreboard");
  var scoreboardListEl = document.getElementById("gameScoreboardList");
  var gameOverRetryBtn = document.getElementById("gameOverRetry");
  var gameOverCloseBtn = document.getElementById("gameOverClose");
  var duckBtn = document.getElementById("gameDuckBtn");

  // ---- Ranking en la nube ----
  // TODO: reemplazar por tu endpoint real (JSONBin, Firebase Realtime DB, etc).
  // - JSONBin v3: GET usa ".../b/<ID>/latest" y PUT usa ".../b/<ID>" (sin "/latest").
  //   Si usás JSONBin, dejá ENDPOINT_URL apuntando al GET y ajustá la URL del
  //   PUT en saveHighScore() quitándole el "/latest".
  // - Firebase Realtime DB: la MISMA url "https://tu-proyecto.firebaseio.com/scores.json"
  //   sirve para GET y PUT tal cual está armado abajo.
  var ENDPOINT_URL = "https://api.jsonbin.io/v3/b/REEMPLAZA_CON_TU_BIN_ID/latest";
  // Si tu servicio pide una API key para escribir (JSONBin la pide), ponela acá.
  // Se manda como header "X-Master-Key" solo si no está vacía.
  var API_KEY = "";

  var LOCAL_STORAGE_KEY = "sensastreaming-highscores";
  var MAX_SCORES = 5;
  var MAX_INITIALS_LENGTH = 3;

  // ---- Físicas y constantes (fáciles de ajustar) ----
  var GRAVITY = 0.55;
  var JUMP_VELOCITY = -9.5;
  var PLAYER_HEIGHT = 28;
  var DUCK_HEIGHT = 16;
  var OBSTACLE_WIDTH = 34;
  var OBSTACLE_HEIGHT = 30;
  var FLYING_OBSTACLE_Y = 20;   // altura del piso a la que flota
  var FLYING_OBSTACLE_HEIGHT = 18;
  var FLYING_CHANCE = 0.3;      // 30% de los obstáculos flotan (se esquivan agachado)
  var BASE_SPEED = 4.2;         // px por frame (a 60fps)
  var MAX_SPEED = 10;
  var SPEED_RAMP = 0.0015;      // cuánto sube la velocidad por frame

  var isOpen = false;
  var isRunning = false;
  var isGameOver = false;

  var playerX = 30;   // se recalcula con la posición real en el DOM
  var playerY = 0;     // altura sobre el piso (0 = apoyado)
  var velocityY = 0;
  var isDucking = false;

  var obstacles = [];  // { el, x, y, height }
  var nextObstacleIn = 0;
  var speed = BASE_SPEED;
  var score = 0;
  var currentFinalScore = 0; // puntaje capturado en el momento exacto de morir
  var rafId = null;
  var lastTime = null;

  function formatScore(n) {
    var s = String(Math.floor(n));
    while (s.length < 5) s = "0" + s;
    return s;
  }

  function randomGap() {
    // distancia en px hasta el próximo obstáculo
    return 260 + Math.random() * 340;
  }

  function boxesOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function getPlayerBox() {
    var height = isDucking ? DUCK_HEIGHT : PLAYER_HEIGHT;
    return { x: playerX, y: playerY, width: 22, height: height };
  }

  function setDucking(value) {
    if (isDucking === value) return;
    isDucking = value;
    player.classList.toggle("ducking", value);
    if (duckBtn) duckBtn.classList.toggle("is-pressed", value);
  }

  function jump() {
    if (playerY === 0) velocityY = JUMP_VELOCITY;
  }

  function clearObstacles() {
    obstacles.forEach(function (o) { o.el.remove(); });
    obstacles = [];
  }

  function spawnObstacle() {
    var isFlying = Math.random() < FLYING_CHANCE;
    var el = document.createElement("div");
    el.className = "game-obstacle" + (isFlying ? " flying" : "");
    el.innerHTML =
      '<div class="tv-antenna left"></div>' +
      '<div class="tv-antenna right"></div>' +
      '<div class="tv-body"><div class="tv-screen"></div></div>' +
      '<div class="tv-legs"></div>';
    stage.appendChild(el);
    obstacles.push({
      el: el,
      x: stage.clientWidth + OBSTACLE_WIDTH,
      y: isFlying ? FLYING_OBSTACLE_Y : 0,
      height: isFlying ? FLYING_OBSTACLE_HEIGHT : OBSTACLE_HEIGHT
    });
  }

  function resetGame() {
    clearObstacles();
    playerX = player.offsetLeft;
    playerY = 0;
    velocityY = 0;
    setDucking(false);
    player.style.transform = "translateY(0px)";
    speed = BASE_SPEED;
    score = 0;
    nextObstacleIn = randomGap();
    scoreEl.textContent = formatScore(score);
    isGameOver = false;
    gameOverEl.classList.remove("visible");
  }

  function startGame() {
    resetGame();
    isRunning = true;
    messageEl.classList.remove("visible");
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }

  // ---- Ranking en la nube, con respaldo en localStorage ----

  function buildHeaders() {
    var headers = { "Content-Type": "application/json" };
    if (API_KEY) headers["X-Master-Key"] = API_KEY;
    return headers;
  }

  function extractScores(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.scores)) return data.scores;
    if (data && data.record && Array.isArray(data.record.scores)) return data.record.scores;
    return [];
  }

  function sanitizeScores(list) {
    return list
      .filter(function (item) {
        return item && typeof item.name === "string" && typeof item.score === "number";
      })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, MAX_SCORES);
  }

  function readLocalScores() {
    try {
      var raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return []; // localStorage puede no estar disponible (modo privado, etc.)
    }
  }

  function writeLocalScores(list) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      // no es crítico si falla — el juego sigue funcionando igual
    }
  }

  // Devuelve una promesa que SIEMPRE resuelve (nunca rechaza): si el fetch
  // falla, cae de vuelta a localStorage para que el juego no se rompa.
  function getTopScores() {
    return fetch(ENDPOINT_URL, { method: "GET", headers: buildHeaders() })
      .then(function (res) {
        if (!res.ok) throw new Error("Respuesta no OK: " + res.status);
        return res.json();
      })
      .then(function (data) {
        return sanitizeScores(extractScores(data));
      })
      .catch(function (err) {
        console.warn("Sensastreaming: no se pudo leer el ranking en la nube, usando localStorage.", err);
        return sanitizeScores(readLocalScores());
      });
  }

  // Vuelve a pedir el ranking más fresco antes de agregar el nuevo puntaje
  // (evita pisar puntajes que otra persona haya guardado mientras el
  // jugador escribía sus iniciales), lo guarda en la nube y, si eso
  // falla, al menos lo deja guardado en localStorage.
  function saveHighScore(name, points) {
    return getTopScores().then(function (current) {
      var updated = sanitizeScores(current.concat([{ name: name, score: points }]));

      return fetch(ENDPOINT_URL, {
        method: "PUT",
        headers: buildHeaders(),
        body: JSON.stringify({ scores: updated })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Respuesta no OK: " + res.status);
          writeLocalScores(updated);
          return updated;
        })
        .catch(function (err) {
          console.warn("Sensastreaming: no se pudo guardar en la nube, se guardó solo en localStorage.", err);
          writeLocalScores(updated);
          return updated;
        });
    });
  }

  function qualifies(points, currentTop) {
    if (currentTop.length < MAX_SCORES) return true;
    var lowest = currentTop[currentTop.length - 1].score; // ya viene ordenado desc
    return points > lowest;
  }

  function renderScoreboard(list) {
    scoreboardListEl.innerHTML = "";
    list.forEach(function (entry, index) {
      var li = document.createElement("li");
      li.className = "game-scoreboard-row" + (index === 0 ? " is-first" : "");

      var rank = document.createElement("span");
      rank.className = "game-scoreboard-rank";
      rank.textContent = (index + 1) + ".";

      var name = document.createElement("span");
      name.className = "game-scoreboard-name";
      name.textContent = entry.name;

      var scoreSpan = document.createElement("span");
      scoreSpan.className = "game-scoreboard-score";
      scoreSpan.textContent = "- " + formatScore(entry.score);

      li.appendChild(rank);
      li.appendChild(name);
      li.appendChild(scoreSpan);
      scoreboardListEl.appendChild(li);
    });
    scoreboardEl.classList.remove("hidden");
  }

  function showGameOver(finalScore) {
    currentFinalScore = finalScore;
    gameOverScoreEl.textContent = formatScore(finalScore);
    gameOverStatusEl.textContent = "Conectando con el ranking global…";
    initialsForm.classList.add("hidden");
    scoreboardEl.classList.add("hidden");
    gameOverEl.classList.add("visible");

    getTopScores().then(function (current) {
      gameOverStatusEl.textContent = "";

      if (qualifies(finalScore, current)) {
        renderScoreboard(current); // muestra el ranking actual mientras decide sus iniciales
        initialsForm.classList.remove("hidden");
        initialsInput.value = "";
        initialsInput.focus();
      } else {
        renderScoreboard(current);
      }
    });
  }

  function endGame() {
    isRunning = false;
    isGameOver = true;
    if (rafId) cancelAnimationFrame(rafId);
    messageEl.classList.remove("visible");
    showGameOver(Math.floor(score));
  }

  function loop(time) {
    if (!isRunning) return;
    if (lastTime === null) lastTime = time;
    // normaliza a "frames de 60fps" para que la física no dependa del
    // refresco real de la pantalla; tope de 3 por si la pestaña estuvo
    // en segundo plano y el salto de tiempo es enorme.
    var dt = Math.min((time - lastTime) / 16.6667, 3);
    lastTime = time;

    velocityY += GRAVITY * dt;
    playerY -= velocityY * dt;
    if (playerY < 0) { playerY = 0; velocityY = 0; }
    player.style.transform = "translateY(" + (-playerY) + "px)";

    speed = Math.min(MAX_SPEED, speed + SPEED_RAMP * dt);
    score += dt * 0.5;
    scoreEl.textContent = formatScore(score);

    nextObstacleIn -= speed * dt;
    if (nextObstacleIn <= 0) {
      spawnObstacle();
      nextObstacleIn = randomGap();
    }

    var playerBox = getPlayerBox();

    for (var i = obstacles.length - 1; i >= 0; i--) {
      var o = obstacles[i];
      o.x -= speed * dt;
      o.el.style.left = o.x + "px";

      if (o.x + OBSTACLE_WIDTH < 0) {
        o.el.remove();
        obstacles.splice(i, 1);
        continue;
      }

      var obstacleBox = { x: o.x, y: o.y, width: OBSTACLE_WIDTH, height: o.height };
      if (boxesOverlap(playerBox, obstacleBox)) {
        endGame();
        return;
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  function openGame() {
    isOpen = true;
    overlay.classList.add("is-open");
    document.documentElement.classList.add("splash-lock"); // reutiliza el bloqueo de scroll
    resetGame();
    messageEl.innerHTML =
      '<p class="game-message-title">Toca la pantalla o presiona <kbd>Espacio</kbd> para empezar</p>' +
      '<p class="game-message-hint game-hint-keys">Espacio o ↑ para saltar · ↓ para agacharte</p>' +
      '<p class="game-message-hint game-hint-touch">Toca la pantalla para saltar · mantén "Agachar" para esquivar</p>';
    messageEl.classList.add("visible");
    closeBtn.focus();
  }

  function closeGame() {
    isOpen = false;
    isRunning = false;
    if (rafId) cancelAnimationFrame(rafId);
    overlay.classList.remove("is-open");
    document.documentElement.classList.remove("splash-lock");
    clearObstacles();
  }

  trigger.addEventListener("click", openGame);
  closeBtn.addEventListener("click", closeGame);

  // Cierra al hacer click en el fondo oscuro (no en el panel)
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeGame();
  });

  document.addEventListener("keydown", function (e) {
    if (!isOpen) return; // fuera del juego, el teclado se comporta normal
    if (document.activeElement === initialsInput) return; // dejá que el input reciba las teclas normalmente

    if (e.key === "Escape") {
      closeGame();
      return;
    }

    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault(); // evita que la página haga scroll mientras se juega
      if (!isRunning) startGame();
      else jump();
    }

    if (e.code === "ArrowDown") {
      e.preventDefault();
      if (isRunning) setDucking(true);
    }
  });

  document.addEventListener("keyup", function (e) {
    if (!isOpen) return;
    if (document.activeElement === initialsInput) return;
    if (e.code === "ArrowDown") {
      e.preventDefault();
      setDucking(false);
    }
  });

  // Fuerza mayúsculas y solo letras mientras se escriben las iniciales
  initialsInput.addEventListener("input", function () {
    initialsInput.value = initialsInput.value
      .toUpperCase()
      .replace(/[^A-ZÑ]/g, "")
      .slice(0, MAX_INITIALS_LENGTH);
  });

  initialsForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var initials = initialsInput.value.trim().slice(0, MAX_INITIALS_LENGTH) || "AAA";
    var submitBtn = initialsForm.querySelector(".game-initials-submit");

    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando…";

    saveHighScore(initials, currentFinalScore).then(function (updated) {
      renderScoreboard(updated);
      initialsForm.classList.add("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = "Guardar";
    });
  });

  gameOverRetryBtn.addEventListener("click", function () {
    startGame();
  });

  gameOverCloseBtn.addEventListener("click", function () {
    closeGame();
  });

  // ---- Controles táctiles / puntero ----
  // Tocar el escenario = saltar (o empezar), como el Dino de Chrome en celular.
  // pointerdown dispara una sola vez por toque (sin "click fantasma").
  stage.addEventListener("pointerdown", function () {
    if (!isOpen) return;
    if (!isRunning) startGame();
    else jump();
  });

  // Mantener presionado "Agachar" = agacharse; soltar = pararse.
  if (duckBtn) {
    duckBtn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      if (isRunning) setDucking(true);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (type) {
      duckBtn.addEventListener(type, function () { setDucking(false); });
    });
    // evita el menú contextual de la pulsación larga en iOS/Android
    duckBtn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
})();

/* ==========================================================================
   Podcast — reproductor de audio personalizado (solo en podcast.html)
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("audioPlayer");
  var audio = document.getElementById("podcastAudio");
  if (!root || !audio) return;

  var playBtn = document.getElementById("audioPlay");
  var seek = document.getElementById("audioSeek");
  var curEl = document.getElementById("audioCurrent");
  var remEl = document.getElementById("audioRemaining");
  var back = document.getElementById("audioBack");
  var fwd = document.getElementById("audioForward");
  var muteBtn = document.getElementById("audioMute");
  var vol = document.getElementById("audioVolume");
  var errEl = document.getElementById("audioError");
  var dragging = false;

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var s = Math.floor(sec);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    var rr = (r < 10 ? "0" : "") + r;
    return h > 0 ? h + ":" + (m < 10 ? "0" : "") + m + ":" + rr : m + ":" + rr;
  }

  function paintRange(input) {
    var min = parseFloat(input.min) || 0;
    var max = parseFloat(input.max) || 100;
    var pct = max > min ? ((parseFloat(input.value) - min) / (max - min)) * 100 : 0;
    input.style.setProperty("--fill", pct + "%");
  }

  function updateTimes() {
    var d = audio.duration;
    var t = dragging ? (parseFloat(seek.value) / 100) * d : audio.currentTime;
    curEl.textContent = fmt(t);
    remEl.textContent = isFinite(d) ? "-" + fmt(d - t) : "-0:00";
    if (!dragging && isFinite(d) && d > 0) {
      seek.value = (audio.currentTime / d) * 100;
    }
    paintRange(seek);
  }

  function setPlaying(on) {
    root.classList.toggle("is-playing", on);
    playBtn.setAttribute("aria-label", on ? "Pausar" : "Reproducir");
  }

  function toggle() {
    if (audio.paused) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { errEl.hidden = false; });
    } else {
      audio.pause();
    }
  }

  function skip(delta) {
    if (!isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  }

  function syncVolume() {
    var muted = audio.muted || audio.volume === 0;
    root.classList.toggle("is-muted", muted);
    muteBtn.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar");
    vol.value = audio.muted ? 0 : audio.volume;
    paintRange(vol);
  }

  audio.addEventListener("loadedmetadata", function () {
    seek.disabled = false;
    errEl.hidden = true;
    updateTimes();
  });
  audio.addEventListener("timeupdate", updateTimes);
  audio.addEventListener("play", function () { setPlaying(true); });
  audio.addEventListener("pause", function () { setPlaying(false); });
  audio.addEventListener("ended", function () { setPlaying(false); audio.currentTime = 0; updateTimes(); });
  audio.addEventListener("error", function () { errEl.hidden = false; });
  audio.addEventListener("volumechange", syncVolume);

  playBtn.addEventListener("click", toggle);
  back.addEventListener("click", function () { skip(-15); });
  fwd.addEventListener("click", function () { skip(15); });

  seek.addEventListener("input", function () { dragging = true; updateTimes(); });
  seek.addEventListener("change", function () {
    if (isFinite(audio.duration)) audio.currentTime = (parseFloat(seek.value) / 100) * audio.duration;
    dragging = false;
    updateTimes();
  });

  vol.addEventListener("input", function () {
    audio.muted = false;
    audio.volume = parseFloat(vol.value);
  });
  muteBtn.addEventListener("click", function () {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      if (audio.volume === 0) audio.volume = 0.6;
    } else {
      audio.muted = true;
    }
  });

  // Atajos solo cuando el foco está dentro del reproductor
  root.addEventListener("keydown", function (e) {
    var tag = e.target && e.target.tagName;
    if (e.key === "ArrowLeft" && tag === "BUTTON") { skip(-15); }
    else if (e.key === "ArrowRight" && tag === "BUTTON") { skip(15); }
  });

  syncVolume();
  updateTimes();
})();

/* ==========================================================================
   Suscripción por correo (solo en index.html) — envía a Google Apps Script
   ========================================================================== */
(function () {
  "use strict";

  var form = document.getElementById("subscribeForm");
  if (!form) return;

  // Pega aquí la URL de la aplicación web de Apps Script (termina en /exec)
  var ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbxR61WsJoxDqoOrawBemCzkSugyAYC-In14txnE3HMSab7NStxhkkBgQ7l14t8sh_GT/exec";

  var input = document.getElementById("subscribeEmail");
  var trap = document.getElementById("subscribeTrap");
  var btn = document.getElementById("subscribeBtn");
  var msg = document.getElementById("subscribeMsg");

  function say(text, kind) {
    msg.textContent = text;
    msg.className = "subscribe-msg" + (kind ? " is-" + kind : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = (input.value || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      say("Escribe un correo válido, por ejemplo nombre@correo.com.", "error");
      input.focus();
      return;
    }
    if (ENDPOINT_URL.indexOf("http") !== 0) {
      say("La suscripción aún no está configurada.", "error");
      return;
    }

    btn.disabled = true;
    say("Enviando…");

    // Misma petición que funciona al abrir el link directo. Con no-cors el navegador
    // no puede leer la respuesta, pero la solicitud sí llega y el script envía el correo.
    var url = ENDPOINT_URL +
      (ENDPOINT_URL.indexOf("?") === -1 ? "?" : "&") +
      "email=" + encodeURIComponent(email) + "&src=web&t=" + Date.now();

    // Segunda vía (pixel): llega aunque fetch esté bloqueado. El script no reenvía si ya existe.
    try { new Image().src = url + "&via=img"; } catch (err) {}

    fetch(url, { method: "GET", mode: "no-cors", cache: "no-store", credentials: "omit" })
      .then(function () {
        btn.disabled = false;
        say("¡Solicitud enviada! En unos minutos recibirás el correo de bienvenida. Si no lo ves, revisa la carpeta de spam.", "ok");
        form.reset();
      })
      .catch(function () {
        btn.disabled = false;
        say("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.", "error");
      });
  });
})();
