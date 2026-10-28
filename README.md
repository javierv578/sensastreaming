# Sensastreaming

Plataforma demostrativa tipo streaming (estilo Netflix/Prime Video) para publicar en GitHub Pages. 6 archivos, sin dependencias de build.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (público, o privado con GitHub Pro).
2. Sube estos 6 archivos a la raíz del repo (o a una carpeta `docs/` si prefieres).
3. Ve a **Settings → Pages**.
4. En "Source" elige la rama (`main`) y la carpeta (`/root` o `/docs`, según dónde subiste los archivos).
5. Guarda. GitHub entrega una URL tipo `https://tuusuario.github.io/tu-repo/` en 1-2 minutos.

No hace falta `npm install` ni proceso de build: son archivos estáticos.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Home: splash screen, hero, carrusel de "Destacados" |
| `reportajes.html` | Catálogo completo con tabs de categoría |
| `acerca-de.html` | Quiénes somos + fotos del equipo |
| `podcast.html` | Placeholder "Próximamente" |
| `styles.css` | Todo el estilo visual, tokens de color en `:root` |
| `script.js` | Toda la lógica de interacción (dividida en bloques independientes) |

## Cosas fáciles de editar

- **Los 4 reportajes** (título, imagen, video de YouTube, categoría): en cada `.html`, cada `<article class="card" data-yt="ID_DE_YOUTUBE" data-category="...">`. El buscador del header usa su **propia** copia de estos mismos datos, como un array `REPORTAJES` al principio del bloque "buscador del header" en `script.js` — si cambias un reportaje en el HTML, actualiza también ese array para que el buscador no quede desincronizado.
- **Colores**: en `styles.css`, dentro de `:root { ... }`. `--accent-crimson` es el dorado principal (el nombre quedó de una paleta anterior).
- **Textos** (tagline, ticker, "acerca de"): directo en cada `.html`.
- **Duración del splash screen**: variable `DURATION` (en milisegundos) al principio del bloque "pantalla de carga" en `script.js`.

## Notas de mantenimiento

- Todas las imágenes son de Imgur (`i.imgur.com`) — verifica que sigan activas después de una migración o mudanza de cuenta.
- `script.js` está dividido en bloques independientes (uno por función: splash, buscador, categorías, reloj, tarjetas). Cada uno revisa si sus elementos existen antes de engancharse, por eso el mismo archivo sirve para las 4 páginas sin dar errores aunque no todas tengan los mismos elementos.
- El `<div class="live-clock" id="liveClock">` en el header tiene ids internos (`#liveClockTime`, `#liveClockOffset`) de los que depende el reloj en vivo — no renombrarlos.

© 2026 Sensastreaming — Plataforma demostrativa. Los videos enlazados pertenecen a sus respectivos autores en YouTube.
