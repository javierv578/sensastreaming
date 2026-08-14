# Sensastreaming

Landing page tipo streaming (estilo Netflix) para publicar en GitHub Pages.
3 archivos, sin dependencias de build: `index.html`, `style.css`, `script.js`.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (puede ser público o privado con GitHub Pro).
2. Sube estos 3 archivos a la raíz del repo (o a una carpeta `docs/` si prefieres).
3. Ve a **Settings → Pages**.
4. En "Source" elige la rama (`main`) y la carpeta (`/root` o `/docs`, según dónde subiste los archivos).
5. Guarda. GitHub te entregará una URL tipo `https://tuusuario.github.io/tu-repo/` en 1-2 minutos.

No hace falta `npm install` ni proceso de build: son archivos estáticos.

## Qué hace cada archivo

- **index.html** — estructura: header, ticker de titulares, hero, catálogo (4 tarjetas) y sección "Acerca de".
- **style.css** — toda la identidad visual (paleta, tipografía, layout responsivo).
- **script.js** — header que se vuelve sólido al hacer scroll, menú móvil, y la lógica de preview: al pasar el mouse (o mantener una tarjeta centrada mientras deslizas en el celular) se carga un adelanto en video de YouTube con un pequeño retraso, silenciado y en loop.

## Cosas fáciles de editar

- **Enlaces y miniaturas de cada video**: en `index.html`, cada `<article class="card" data-yt="ID_DE_YOUTUBE">` — cambia el `data-yt`, el `src` de la imagen y el `href` del botón "▶ Ver".
- **Textos** (tagline del hero, sección "Acerca de", ticker): directamente en `index.html`, todo en español y editable sin tocar el JS.
- **Colores**: al inicio de `style.css`, dentro de `:root { ... }` (--ink, --alert, --chyron, etc).

## Nota sobre las imágenes del video 1

En tu mensaje llegaron dos enlaces de imagen para el Video 1 (uno de ellos con una etiqueta rota). Como el segundo enlace (`ZKIbFsF.jpeg`) coincidía con la descripción "mujer llorando" y el primero (`p3X7n6U.jpeg`) ya estaba asignado al Video 2 ("sujeto en el juzgado"), usé `ZKIbFsF.jpeg` para el Video 1. Si no es el que querías, es un cambio de una línea en `index.html`.
