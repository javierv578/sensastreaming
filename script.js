/* ==========================================================================
   SENSASTREAMING — interactions
   - Header turns solid on scroll
   - Mobile nav toggle
   - Cards: hover (desktop) / tap (touch) / auto-preview while centered
     during a swipe (mobile) all trigger a short delayed YouTube preview
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
  var PREVIEW_DELAY = 500; // ms before the trailer preview loads

  /* ---------------------------------------------------------------------
     Header: solid background once the page has scrolled a little
     --------------------------------------------------------------------- */
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------------------- */
  if (navToggle) {
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
     Card preview logic
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

    if (prefersReducedMotion) return; // description/scrim only, no video

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
    // Desktop: real hover + keyboard focus
    if (hasHover) {
      card.addEventListener("mouseenter", function () { activate(card); });
      card.addEventListener("mouseleave", function () { deactivate(card); });
      card.addEventListener("focus", function () { activate(card); });
      card.addEventListener("blur", function () { deactivate(card); });
    }

    // Click / tap anywhere on an already-active card opens the video.
    // On a not-yet-active card (touch, or a click that outran hover) it
    // just triggers the preview instead of jumping straight to YouTube.
    card.addEventListener("click", function (e) {
      if (e.target.closest(".play-btn")) return; // let the link do its job
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

  // Close the open preview when tapping/clicking outside the row
  document.addEventListener("click", function (e) {
    if (row.contains(e.target)) return;
    cards.forEach(deactivate);
  });

  /* ---------------------------------------------------------------------
     Touch devices: as the row is swiped, whichever card sits centered
     gets previewed automatically — mirrors "deslizar para ver un adelanto"
     --------------------------------------------------------------------- */
  if (!hasHover && "IntersectionObserver" in window) {
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
})();
