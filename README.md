# Innova AI Assistance: sitio web

Sitio estático publicado con GitHub Pages en https://innovaassistanceai.com.co (archivo `CNAME`).
No necesita compilación: se edita y se publica tal cual.

## Estructura

- `index.html`: contenido en español, SEO (title, description, Open Graph, datos estructurados).
- `assets/css/site.css`: estilos. Tema oscuro, un solo acento azul, tipografía Geist (incluida en `assets/fonts`).
- `assets/js/i18n.js`: textos en inglés y las listas en ambos idiomas (comparación, industrias, casos, proceso, calculadora).
- `assets/js/demo-engine.js`: motor de la demo "Habla con un asistente de Innova AI".
- `assets/js/site.js`: interacción (demo, animaciones, calculadora, formulario de contacto).
- `assets/icons.svg`: íconos de Phosphor Icons (licencia MIT).

## Tareas comunes

- **Poner el video real**: sube el archivo (por ejemplo `assets/video/innova.mp4`) y escribe su ruta en
  `data-video-src` de `#filmFrame` en `index.html` (y una imagen en `data-poster` si quieres).
- **Publicar un caso real**: en `assets/js/i18n.js`, en `cases`, cambia `real: false` por `real: true` y llena
  `results` con cifras reales y verificadas, por ejemplo `{ v: "+35%", l: "conversaciones atendidas" }`.
- **Conectar la demo a un modelo de IA real**: antes de cargar `demo-engine.js`, define
  `window.INNOVA_DEMO_ENDPOINT = "https://.../demo"`. El contrato está documentado al inicio de `demo-engine.js`.
  Si el endpoint falla, la demo vuelve sola al modo simulado.
- **Formulario de contacto**: envía a `/contact` del bot (constante `CONTACT_ENDPOINT` en `site.js`).
  Si falla, ofrece WhatsApp con el mensaje ya escrito.

La versión anterior del sitio quedó guardada en la etiqueta git `backup-antes-rediseno-2026-10`.
