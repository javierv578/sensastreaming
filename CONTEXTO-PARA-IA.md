# Contexto del proyecto: Sensastreaming

Pega este documento al principio de tu conversación con la otra IA para ponerla al día sin tener que explicar todo de nuevo.

## Qué es

"Sensastreaming" es una plataforma de demostración (proyecto de práctica/portafolio) que imita el diseño de un servicio de streaming (estilo Netflix / Prime Video) pero para reportajes de tono sensacionalista: testimonios, juicios y entrevistas. Nombre y concepto son intencionalmente "tabloide" — los títulos de las tarjetas son preguntas tipo clickbait a propósito.

## Stack técnico

- HTML + CSS + JavaScript puro. **Sin frameworks, sin build, sin backend, sin base de datos.**
- 4 páginas HTML independientes + 1 hoja de estilos compartida + 1 script compartido.
- Publicado en GitHub Pages (estático).

## Estructura de archivos

- `index.html` — Home: splash screen de carga, hero grande, carrusel "Destacados" (mismas 4 tarjetas que el catálogo completo).
- `reportajes.html` — Catálogo completo con tabs de filtro por categoría.
- `acerca-de.html` — "Quiénes somos": intro + tarjetas del equipo con foto.
- `podcast.html` — Página placeholder ("Próximamente"), sin contenido real todavía.
- `styles.css` — Todo el CSS. Variables de diseño en `:root`.
- `script.js` — Todo el JS, dividido en bloques (IIFEs) independientes por función.

## Sistema de diseño (variables clave en `styles.css`)

```css
--bg-void: #130622;        /* fondo general, morado muy oscuro */
--bg-surface: #1d0d33;     /* tarjetas y secciones */
--bg-surface-2: #281445;   /* resaltes/hovers */
--accent-crimson: #d4af37; /* dorado — el nombre quedó de una paleta anterior (roja) */
--accent-amber: #f5b700;   /* segundo acento, tipo "chyron" de noticiero */
--text-primary: #f4f2ec;
```

Tipografías: **Anton** (títulos grandes, estilo cartel), **Inter** (texto/UI), **Space Mono** (etiquetas, timecodes, categorías — refuerza el lenguaje visual de "transmisión en vivo").

Elemento de marca distintivo: una cinta tipo "última hora" (`.ticker`) fija debajo del header en todas las páginas, y un reloj "EN VIVO" con la hora de Santiago de Chile (`America/Santiago` vía `Intl.DateTimeFormat`, así el cambio de horario de verano se resuelve solo).

## Contenido actual (4 "reportajes"/capítulos — están hardcodeados, no vienen de ninguna API)

| # | Título | Categoría | YouTube ID |
|---|---|---|---|
| 1 | ¿Como llegar a la fama? | testimonio | hI8e6JMbuSg |
| 2 | Polémicas fuera de la cancha | judicial | video MP4 (R2): docudeportes.mp4 |
| 3 | El caso que taparon los memes | judicial | video MP4 (R2): TUFIT MÁS PERIODISTA.mp4 |
| 4 | ¿Influencers o creadores de estigmas? | entrevista | i1BO0bbKCyo |

Equipo (`acerca-de.html`): Alejandro Álvarez, Gabriel Salinas, Javier Vera — cada uno con foto flotante (sin fondo circular, con una animación sutil de "levitar") y una descripción de dónde hace su práctica profesional.

## Funcionalidades ya implementadas

1. **Splash screen** (5 segundos exactos, controlados por JS) con logo, barra de progreso y un "stickman" caminando sincronizado con el avance de la barra — todo en CSS puro + un solo `requestAnimationFrame`.
2. **Reloj en vivo** en el header (solo desktop, ≥900px).
3. **Buscador del header** (ícono de lupa): al escribir, abre un mini-menú flotante estilo Netflix/Prime con miniatura + título de las coincidencias. **No filtra ni reordena las tarjetas de la página** — usa su propia copia de los datos (array `REPORTAJES` dentro de `script.js`), así funciona igual en las 4 páginas, incluidas las que no tienen catálogo. Clic en un resultado abre el video de YouTube directo.
4. **Mini-menú de categorías** (ícono de cuadrícula): links reales a `reportajes.html?categoria=X`. `reportajes.html` lee ese parámetro al cargar y deja el tab correspondiente ya activo.
5. **Tabs de categoría** en `reportajes.html` (Todos/Testimonios/Judicial/Entrevistas) — estos sí filtran la grilla en vivo con la clase `.filtered-out`.
6. **Preview de video** al pasar el mouse sobre una tarjeta (desktop, con medio segundo de demora) / auto-preview de la tarjeta centrada al deslizar (mobile, vía `IntersectionObserver`).
7. Menú móvil tipo hamburguesa, responsivo en todos los breakpoints.

## Decisiones de arquitectura a tener en cuenta antes de tocar el código

- `script.js` está dividido en **bloques independientes (IIFEs)**, uno por feature (splash, buscador, categorías, reloj, tarjetas/tabs). Cada bloque hace `if (!elemento) return;` al principio, así el mismo archivo sirve para las 4 páginas sin tirar errores aunque una página no tenga ese elemento. Si agregas una feature nueva, seguí el mismo patrón en vez de mezclar lógica de páginas distintas en un solo bloque.
- El `<div class="live-clock" id="liveClock">` en el header es sensible: el JS depende de los ids internos `#liveClockTime` y `#liveClockOffset`. No renombrarlos sin actualizar `script.js`.
- El buscador dejó **a propósito** de tocar el DOM de `#cardRow` — antes lo hacía y causaba que la sección "Destacados" del home se reacomodara/encogiera mientras se escribía (bug real, ya resuelto). Si se te ocurre "mejorar" el buscador, que no vuelva a filtrar la grilla in-place.
- Todas las animaciones (ticker, splash, foto flotante del equipo, etc.) respetan `prefers-reduced-motion`.
- Las imágenes son todas de Imgur (`i.imgur.com`) — nunca se verificó de forma remota que carguen (no hubo forma de acceder a esas URLs para confirmarlo), conviene revisarlas visualmente en el navegador.

## Qué NO tiene este proyecto (para no asumir de más)

- Sin backend, sin base de datos, sin sistema de cuentas/perfiles (por eso no hay íconos de "Mi lista" ni "Perfil" en el header — se sacaron a propósito).
- El podcast no tiene episodios reales todavía, es solo una página de "Próximamente".
- El buscador y el filtro de categorías no están conectados entre sí ni con ningún backend — todo el "catálogo" son los mismos 4 ítems hardcodeados en dos lugares (el HTML de las tarjetas, y el array `REPORTAJES` en `script.js`).
