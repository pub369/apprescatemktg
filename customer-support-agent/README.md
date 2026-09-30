# Soporte Amigo — PWA de atención al cliente

Agente de atención al cliente para pequeñas empresas. Se instala desde el navegador en una PC o teléfono como una aplicación web progresiva (PWA).

## Incluye

- **Memoria local:** guarda notas importantes del cliente solo en el navegador del dispositivo.
- **Personalidad configurable:** nombre del negocio, nombre del agente, tono, correo de escalamiento, mensaje base y preguntas frecuentes.
- **Herramienta de búsqueda:** si el mensaje usa términos como “busca” o “investiga”, consulta resultados públicos de Wikipedia desde la interfaz.
- **Uso offline:** la interfaz se conserva con un service worker tras la primera visita. La búsqueda externa requiere conexión.
- **Respaldo:** descarga un JSON con configuración, memoria e historial.

> El motor incluido responde desde tus FAQ y preferencias; no requiere una clave de IA. Para respuestas generativas reales se puede conectar después un proveedor de IA mediante un backend seguro. No coloques claves de API en el navegador.

## Ejecutar localmente

Requisito: Node.js 18 o superior.

```bash
npm test
npm start
```

Luego abre `http://localhost:4173`.

## Instalar en PC o teléfono

1. Publica esta carpeta en un hosting HTTPS (por ejemplo, Netlify, Vercel, GitHub Pages o un servidor propio).
2. Abre la URL desde Chrome, Edge, Android o Safari.
3. Elige **Instalar aplicación**, **Instalar app** o **Añadir a pantalla de inicio** desde el menú del navegador.

Para pruebas locales, algunos navegadores no muestran instalación completa fuera de HTTPS; `localhost` normalmente está permitido.

## Privacidad

La configuración, conversaciones y recuerdos se almacenan con `localStorage` en el navegador actual. El botón **Descargar respaldo** permite guardar una copia. Borrar los datos del sitio o usar otro navegador elimina/separa la memoria.
