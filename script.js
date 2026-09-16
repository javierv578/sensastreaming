/* ==========================================================================
   SENSASTREAMING — pantalla de carga (splash screen)
   Bloque independiente: si la página no tiene #splashScreen (reportajes.html,
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
    { title: "¿Como llegar a la fama?", videoId: "hI8e6JMbuSg", image: "https://i.imgur.com/ZKIbFsF.jpeg", detailUrl: "detalle-fama.html" },
    { title: "¿Deporte o Sensasport?", videoId: "JzhlGWwWn6k", image: "https://i.imgur.com/p3X7n6U.jpeg", detailUrl: "detalle-deporte.html" },
    { title: "¿Politica o Reality?", videoId: "DBuCfMrWrtk", image: "https://i.imgur.com/NYeV6bW.jpeg", detailUrl: "detalle-politica.html" },
    { title: "¿Influencers o creadores de estigmas?", videoId: "i1BO0bbKCyo", image: "https://i.imgur.com/RMKmTpX.jpeg", detailUrl: "detalle-influencers.html" }
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
  }

  function startGame() {
    resetGame();
    isRunning = true;
    messageEl.classList.remove("visible");
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }

  function endGame() {
    isRunning = false;
    isGameOver = true;
    if (rafId) cancelAnimationFrame(rafId);

    messageEl.innerHTML = "";
    var title = document.createElement("p");
    title.className = "game-message-title";
    title.textContent = "Game over — puntaje " + formatScore(score);

    var retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "btn btn-primary game-retry";
    retryBtn.textContent = "Volver a jugar";
    retryBtn.addEventListener("click", startGame);

    messageEl.appendChild(title);
    messageEl.appendChild(retryBtn);
    messageEl.classList.add("visible");
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
      '<p class="game-message-title">Presioná <kbd>Espacio</kbd> para empezar</p>' +
      '<p class="game-message-hint">Espacio o ↑ para saltar · ↓ para agacharte</p>';
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
    if (e.code === "ArrowDown") {
      e.preventDefault();
      setDucking(false);
    }
  });
})();
