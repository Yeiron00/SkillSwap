# SkillSwap — Backend (API REST)

API REST en Node.js + Express + PostgreSQL para el proyecto **SkillSwap**, siguiendo la arquitectura de tres capas y el diagrama de clases descritos en la metodología del proyecto.

## Stack

- **Node.js / Express** — capa de lógica de negocio y API REST
- **PostgreSQL** (`pg`) — capa de persistencia
- **JWT** (`jsonwebtoken`) + **bcryptjs** — autenticación y hash de contraseñas
- **express-validator** — validación de entradas
- **helmet + cors** — cabeceras de seguridad y control de origen

## 1. Requisitos

- Node.js 18+
- Una base de datos PostgreSQL, cualquiera de estas opciones:
  - Instalación local de PostgreSQL 16
  - Un servicio gratuito en la nube: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app) o [Render](https://render.com) (mencionados en el documento de metodología)

## 2. Instalación

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` y coloca tu `DATABASE_URL` real (local o de un proveedor en la nube) y un `JWT_SECRET` propio.

## 3. Crear el esquema de base de datos

```bash
npm run db:init            # crea las tablas (sql/schema.sql)
npm run db:init -- --seed  # además inserta usuarios y habilidades de ejemplo (sql/seed.sql)
```

Los usuarios de ejemplo (si usas `--seed`) tienen todos la contraseña `123456`:
`laura@skillswap.co`, `miguel@skillswap.co`, `yeiron@skillswap.co`, `alison@skillswap.co`, `daniel@skillswap.co`.

## 4. Ejecutar el servidor

```bash
npm start        # producción
npm run dev       # con recarga automática (node --watch)
```

La API queda disponible en `http://localhost:4000/api` (o el `PORT` que definas).

## 5. Prueba de humo (sin necesidad de PostgreSQL real)

Para verificar rápidamente que toda la lógica de negocio funciona sin depender de una base de datos instalada, el proyecto incluye `smoke-test.js`, que levanta la API sobre una PostgreSQL **en memoria** (`pg-mem`) y ejercita los 12 requerimientos funcionales de punta a punta (registro, login, permisos, habilidades, solicitudes, ciclo de vida del intercambio, mensajería y calificaciones).

```bash
npm install --no-save pg-mem   # dependencia de prueba, no se usa en producción
node smoke-test.js
```

## 6. Endpoints principales

Todas las rutas protegidas requieren el header `Authorization: Bearer <token>` obtenido en `/auth/login` o `/auth/registro`.

| RF | Método y ruta | Descripción |
|----|----------------|-------------|
| RF-01 | `POST /api/auth/registro` | Crea una cuenta nueva |
| RF-02 | `POST /api/auth/login` | Inicia sesión, devuelve JWT |
| RF-02 | `POST /api/auth/logout` | Cierra sesión (el cliente descarta el token) |
| RF-03 | `GET /api/usuarios/me` | Mi perfil |
| RF-03 | `PUT /api/usuarios/me` | Editar mi perfil |
| RF-06 | `GET /api/usuarios/:id` | Perfil público de otro usuario (con habilidades y calificaciones) |
| RF-04 | `POST /api/habilidades` | Publicar una habilidad |
| RF-04 | `PUT /api/habilidades/:id` | Editar una habilidad propia |
| RF-04 | `DELETE /api/habilidades/:id` | Eliminar una habilidad propia |
| RF-05 | `GET /api/habilidades?q=&categoria=` | Buscar habilidades |
| RF-07 | `GET /api/emparejamiento` | Usuarios con intereses compatibles |
| RF-08 | `POST /api/solicitudes` | Enviar solicitud de intercambio |
| RF-09 | `GET /api/solicitudes?tipo=recibidas\|enviadas` | Listar mis solicitudes |
| RF-09 | `PUT /api/solicitudes/:id/aceptar` | Aceptar (crea el intercambio) |
| RF-09 | `PUT /api/solicitudes/:id/rechazar` | Rechazar |
| — | `PUT /api/solicitudes/:id/cancelar` | Cancelar mientras esté pendiente |
| — | `GET /api/intercambios` | Mis intercambios |
| — | `PUT /api/intercambios/:id/completar` | Marca el intercambio como completado |
| — | `PUT /api/intercambios/:id/cancelar` | Cancela un intercambio en curso |
| RF-11 | `GET /api/mensajes/conversaciones` | Lista de conversaciones |
| RF-11 | `GET /api/mensajes/:usuarioId` | Historial con un usuario |
| RF-11 | `POST /api/mensajes` | Enviar un mensaje |
| RF-12 | `POST /api/calificaciones` | Calificar tras un intercambio completado |

## 7. Ciclo de vida de una solicitud / intercambio

Implementado tal como en el diagrama de estado del documento de metodología:

```
pendiente → aceptada → (se crea intercambio: en_curso) → completada (pendiente de calificación)
                                                                │
                                    ambos usuarios califican ───┘
                                                                ↓
                                                          finalizada (calificada)

pendiente → rechazada
pendiente → cancelada (por el solicitante)
en_curso  → cancelada_mutuo | cancelada_incumplimiento
```

## 8. Seguridad implementada

- Contraseñas con hash `bcrypt` (nunca en texto plano)
- Autenticación por JWT con expiración configurable
- Validación de entradas con `express-validator` en cada ruta que recibe datos
- Cabeceras de seguridad con `helmet`
- CORS restringido al origen del frontend (`CORS_ORIGIN`)
- Consultas parametrizadas (`$1, $2...`) en toda la capa de datos — sin concatenación de strings, previene inyección SQL
- Transacciones (`BEGIN/COMMIT/ROLLBACK` con `FOR UPDATE`) en las operaciones que cambian estado (aceptar solicitud, calificar) para evitar condiciones de carrera

## 9. Despliegue

Pensado para plataformas gratuitas mencionadas en el documento (Render, Vercel, Railway):

1. Crea una base de datos PostgreSQL gestionada (Render/Railway/Neon) y copia su `DATABASE_URL`.
2. Despliega este directorio (`backend/`) como Web Service, con `npm install && npm run db:init` como build step y `npm start` como start command.
3. Configura las variables de entorno del `.env` en el panel del proveedor.
4. Actualiza `CORS_ORIGIN` con la URL pública del frontend desplegado.

## 10. Modo demostración (sin instalar PostgreSQL)

Para probar el flujo completo (frontend + backend) sin instalar PostgreSQL, `dev-inmemory.js` levanta la misma API sobre una PostgreSQL en memoria (`pg-mem`), con el esquema y los datos de ejemplo ya cargados:

```bash
npm run dev:demo
```

Esto NO reemplaza el modo real: los datos se pierden al reiniciar el proceso. Para producción, usa `npm start` con una `DATABASE_URL` real (ver secciones 2-4).

## 11. Integración con el prototipo frontend

El prototipo en `../prototipo` ya está conectado a esta API (ver `../prototipo/api.js`): el registro, login, habilidades, solicitudes, intercambios, mensajería y calificaciones se leen y escriben directamente en PostgreSQL vía `fetch`, con el JWT guardado en `localStorage` tras iniciar sesión. Ya no usa datos simulados.

Para levantar el flujo completo:

```bash
# Terminal 1 — backend (modo demo o real)
cd backend && npm run dev:demo   # o: npm start (con PostgreSQL real configurado)

# Terminal 2 — frontend
cd prototipo && python -m http.server 8788
```

Abre `http://localhost:8788`. Si usas `npm run dev:demo`, los usuarios de ejemplo (`laura@skillswap.co`, `miguel@skillswap.co`, `yeiron@skillswap.co`, `alison@skillswap.co`, `daniel@skillswap.co`, contraseña `123456`) ya existen. Si conectas una PostgreSQL real, corre `npm run db:init -- --seed` primero.

Si cambias el puerto o dominio del backend, actualiza `API_BASE` en `../prototipo/api.js`. Si cambias el puerto del frontend, actualiza `CORS_ORIGIN` en `.env` (o en `dev-inmemory.js` para el modo demo).
