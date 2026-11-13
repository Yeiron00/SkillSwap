# SkillSwap — aplicación de escritorio

Abre SkillSwap en su propia ventana (como un programa), sin navegador. Usa
[Electron](https://www.electronjs.org/) para mostrar el mismo frontend de
`../prototipo` y se conecta al backend desplegado en Render, con la base de datos en Neon.

## Ejecutar

Requisitos: Node.js 18 o superior y conexión a internet.

```bash
cd escritorio
npm install   # solo la primera vez
npm start     # abre la ventana de SkillSwap
```

En VS Code también se puede abrir con **F5** (configuración "SkillSwap (app de escritorio)").

Usuario de prueba: `laura@skillswap.co` / `123456`.

## Prueba automática

```bash
npm run probar
```

Abre la app, inicia sesión con el usuario de prueba contra el backend real y se cierra.
Imprime `OK: sesión iniciada como Laura` si todo funciona.

## Cómo funciona

- `main.js`: crea la ventana (1200×800, sin barra de menú, con el ícono de SkillSwap) y
  carga `prototipo/index.html`. Los enlaces externos se abren en el navegador del sistema.
- El backend solo acepta peticiones desde la página web publicada (CORS). Como la app
  carga el frontend desde archivos locales, `main.js` autoriza ese origen únicamente para
  las respuestas de la API de SkillSwap.
- `iniciar.js`: lanza Electron. Quita la variable `ELECTRON_RUN_AS_NODE`, que algunos
  terminales dejan activada y que impediría abrir la ventana.
