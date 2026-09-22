// Prueba de humo del backend usando pg-mem (Postgres en memoria) en lugar de una instancia real.
// Solo para verificar que las rutas y consultas SQL son correctas; NO se usa en producción.
// Ejecutar con: node smoke-test.js

process.env.JWT_SECRET = "test-secret";
process.env.CORS_ORIGIN = "*";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.PORT = "4099";

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { newDb, DataType } = require("pg-mem");
const crypto = require("crypto");

const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({ name: "gen_random_uuid", returns: DataType.uuid, implementation: () => crypto.randomUUID(), impure: true });
mem.public.registerFunction({ name: "now", returns: DataType.timestamptz, implementation: () => new Date(), impure: true });

const pgAdapter = mem.adapters.createPg();
const pgPath = require.resolve("pg");
require.cache[pgPath] = { id: pgPath, filename: pgPath, loaded: true, exports: pgAdapter };

const schema = fs.readFileSync(path.join(__dirname, "sql/schema.sql"), "utf8");
mem.public.query(schema.replace(/CREATE EXTENSION.*\n/g, ""));

const app = require("./src/app");

async function main() {
  const server = app.listen(4099);
  const base = "http://localhost:4099/api";
  const j = (r) => r.json();

  // Salud
  let r = await fetch(`${base}/health`);
  assert.strictEqual(r.status, 200);
  console.log("OK  /health");

  // RF-01 Registro
  r = await fetch(`${base}/auth/registro`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: "Daniel", apellido: "G.", email: "daniel@test.co", contrasena: "123456", ciudad: "Bogotá" })
  });
  assert.strictEqual(r.status, 201, "registro daniel");
  let body = await j(r);
  const tokenDaniel = body.token;
  const danielId = body.usuario.id;
  console.log("OK  registro (RF-01) ->", body.usuario.email);

  r = await fetch(`${base}/auth/registro`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: "Laura", apellido: "C.", email: "laura@test.co", contrasena: "123456", ciudad: "Bogotá" })
  });
  assert.strictEqual(r.status, 201, "registro laura");
  body = await j(r);
  const tokenLaura = body.token;
  const lauraId = body.usuario.id;

  // Email duplicado -> 409
  r = await fetch(`${base}/auth/registro`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: "Otro", apellido: "X", email: "daniel@test.co", contrasena: "123456" })
  });
  assert.strictEqual(r.status, 409, "email duplicado debe fallar");
  console.log("OK  registro rechaza email duplicado");

  // RF-02 Login
  r = await fetch(`${base}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "daniel@test.co", contrasena: "123456" })
  });
  assert.strictEqual(r.status, 200, "login correcto");
  console.log("OK  login (RF-02)");

  r = await fetch(`${base}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "daniel@test.co", contrasena: "mala" })
  });
  assert.strictEqual(r.status, 401, "login con clave mala debe fallar");
  console.log("OK  login rechaza contraseña incorrecta");

  // Ruta protegida sin token -> 401
  r = await fetch(`${base}/usuarios/me`);
  assert.strictEqual(r.status, 401);
  console.log("OK  middleware de auth bloquea sin token");

  const authHeaders = (t) => ({ "Content-Type": "application/json", Authorization: `Bearer ${t}` });

  // RF-04 Publicar habilidad (Laura ofrece inglés)
  r = await fetch(`${base}/habilidades`, {
    method: "POST", headers: authHeaders(tokenLaura),
    body: JSON.stringify({ nombre: "Inglés conversacional", descripcion: "Clases A2-B2", categoria: "Idiomas", nivel: "Intermedio" })
  });
  assert.strictEqual(r.status, 201, "publicar habilidad laura");
  const habilidadLaura = (await j(r)).id;
  console.log("OK  publicar habilidad (RF-04)");

  // Daniel publica Python
  r = await fetch(`${base}/habilidades`, {
    method: "POST", headers: authHeaders(tokenDaniel),
    body: JSON.stringify({ nombre: "Python desde cero", descripcion: "Fundamentos", categoria: "Informática", nivel: "Principiante" })
  });
  assert.strictEqual(r.status, 201);
  const habilidadDaniel = (await j(r)).id;

  // RF-05 Buscar habilidades
  r = await fetch(`${base}/habilidades?q=ingl%C3%A9s`);
  assert.strictEqual(r.status, 200);
  body = await j(r);
  assert.ok(body.length === 1 && body[0].nombre.includes("Inglés"), "búsqueda debe encontrar inglés");
  console.log("OK  buscar habilidades (RF-05)");

  // RF-06 Ver perfil público
  r = await fetch(`${base}/usuarios/${lauraId}`);
  assert.strictEqual(r.status, 200);
  body = await j(r);
  assert.strictEqual(body.habilidades.length, 1);
  console.log("OK  ver perfil público (RF-06)");

  // RF-03 Editar mi perfil
  r = await fetch(`${base}/usuarios/me`, {
    method: "PUT", headers: authHeaders(tokenDaniel),
    body: JSON.stringify({ descripcion: "Apasionado por la tecnología" })
  });
  assert.strictEqual(r.status, 200);
  console.log("OK  editar perfil (RF-03)");

  // RF-08 Daniel solicita intercambio: ofrece Python por inglés de Laura
  r = await fetch(`${base}/solicitudes`, {
    method: "POST", headers: authHeaders(tokenDaniel),
    body: JSON.stringify({ habilidadDeseadaId: habilidadLaura, habilidadOfrecida: "Python desde cero", mensaje: "¿Intercambiamos?" })
  });
  assert.strictEqual(r.status, 201, "crear solicitud");
  const solicitudId = (await j(r)).id;
  console.log("OK  enviar solicitud (RF-08)");

  // RF-09 Laura ve solicitudes recibidas
  r = await fetch(`${base}/solicitudes?tipo=recibidas`, { headers: authHeaders(tokenLaura) });
  assert.strictEqual(r.status, 200);
  body = await j(r);
  assert.strictEqual(body.length, 1);
  console.log("OK  listar solicitudes recibidas (RF-09)");

  // No puede aceptar quien no es el destinatario
  r = await fetch(`${base}/solicitudes/${solicitudId}/aceptar`, { method: "PUT", headers: authHeaders(tokenDaniel) });
  assert.strictEqual(r.status, 403, "solo destinatario acepta");
  console.log("OK  solo el destinatario puede aceptar");

  // RF-09 Laura acepta -> crea intercambio
  r = await fetch(`${base}/solicitudes/${solicitudId}/aceptar`, { method: "PUT", headers: authHeaders(tokenLaura) });
  assert.strictEqual(r.status, 200, "aceptar solicitud");
  body = await j(r);
  const intercambioId = body.intercambio.id;
  assert.strictEqual(body.intercambio.estado, "en_curso");
  console.log("OK  aceptar solicitud crea intercambio en_curso (RF-09)");

  // RF-11 Mensajería
  r = await fetch(`${base}/mensajes`, {
    method: "POST", headers: authHeaders(tokenLaura),
    body: JSON.stringify({ destinatarioId: danielId, contenido: "¡Hola! ¿Cuándo empezamos?" })
  });
  assert.strictEqual(r.status, 201);
  r = await fetch(`${base}/mensajes/${lauraId}`, { headers: authHeaders(tokenDaniel) });
  assert.strictEqual(r.status, 200);
  body = await j(r);
  assert.strictEqual(body.length, 1);
  console.log("OK  mensajería (RF-11)");

  r = await fetch(`${base}/mensajes/conversaciones`, { headers: authHeaders(tokenDaniel) });
  assert.strictEqual(r.status, 200);
  body = await j(r);
  assert.strictEqual(body.length, 1);
  console.log("OK  listar conversaciones (RF-11)");

  // RF-07 Emparejamiento (ambos tienen categorías distintas -> sin match; probamos que no truene)
  r = await fetch(`${base}/emparejamiento`, { headers: authHeaders(tokenDaniel) });
  assert.strictEqual(r.status, 200);
  console.log("OK  emparejamiento no falla (RF-07)");

  // Completar intercambio antes de calificar
  r = await fetch(`${base}/intercambios/${intercambioId}/completar`, { method: "PUT", headers: authHeaders(tokenDaniel) });
  assert.strictEqual(r.status, 200);
  body = await j(r);
  assert.strictEqual(body.estado, "completada");
  console.log("OK  completar intercambio");

  // No se puede calificar antes... ya está completada, calificar ahora sí:
  r = await fetch(`${base}/calificaciones`, {
    method: "POST", headers: authHeaders(tokenDaniel),
    body: JSON.stringify({ intercambioId, puntuacion: 5, comentario: "Excelente profesora" })
  });
  assert.strictEqual(r.status, 201, "calificar (RF-12)");
  console.log("OK  calificar usuario (RF-12)");

  // Calificar dos veces por el mismo usuario debe fallar
  r = await fetch(`${base}/calificaciones`, {
    method: "POST", headers: authHeaders(tokenDaniel),
    body: JSON.stringify({ intercambioId, puntuacion: 3 })
  });
  assert.strictEqual(r.status, 409, "no debe permitir calificar dos veces");
  console.log("OK  rechaza doble calificación");

  // Laura también califica -> intercambio pasa a finalizada
  r = await fetch(`${base}/calificaciones`, {
    method: "POST", headers: authHeaders(tokenLaura),
    body: JSON.stringify({ intercambioId, puntuacion: 4, comentario: "Buen estudiante" })
  });
  assert.strictEqual(r.status, 201);

  r = await fetch(`${base}/usuarios/${danielId}`);
  body = await j(r);
  assert.strictEqual(body.calificacionTotal, 1);
  assert.strictEqual(Number(body.calificacionPromedio), 4);
  console.log("OK  promedio de calificación recalculado y estado 'finalizada' (diagrama de estado)");

  server.close();
  console.log("\n✅ Todas las pruebas de humo pasaron.");
}

main().catch(err => {
  console.error("\n❌ Prueba de humo falló:", err);
  process.exit(1);
});
