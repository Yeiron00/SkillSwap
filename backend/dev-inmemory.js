// Modo demostración: levanta la misma API (src/app.js) sobre una PostgreSQL en memoria (pg-mem),
// ya con el esquema y los datos de ejemplo cargados. Pensado para probar el flujo completo
// (frontend + backend) sin tener que instalar PostgreSQL localmente.
//
// NO usar en producción: los datos se pierden al reiniciar el proceso.
// Para producción real, configura DATABASE_URL en .env y usa `npm start`.
//
// Uso: node dev-inmemory.js

process.env.JWT_SECRET = process.env.JWT_SECRET || "demo-secret-solo-para-desarrollo";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8788";
process.env.DATABASE_URL = "postgresql://demo:demo@localhost:5432/demo";
process.env.PORT = process.env.PORT || "4000";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { newDb, DataType } = require("pg-mem");

const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({ name: "gen_random_uuid", returns: DataType.uuid, implementation: () => crypto.randomUUID(), impure: true });
mem.public.registerFunction({ name: "now", returns: DataType.timestamptz, implementation: () => new Date(), impure: true });

const pgAdapter = mem.adapters.createPg();
const pgPath = require.resolve("pg");
require.cache[pgPath] = { id: pgPath, filename: pgPath, loaded: true, exports: pgAdapter };

const schema = fs.readFileSync(path.join(__dirname, "sql/schema.sql"), "utf8");
mem.public.query(schema.replace(/CREATE EXTENSION.*\n/g, ""));

const seed = fs.readFileSync(path.join(__dirname, "sql/seed.sql"), "utf8");
mem.public.query(seed);

const app = require("./src/app");
const config = require("./src/config");

app.listen(config.port, () => {
  console.log(`\nSkillSwap API (modo demostración, datos en memoria) escuchando en http://localhost:${config.port}`);
  console.log(`CORS habilitado para: ${config.corsOrigin}`);
  console.log(`Usuarios de ejemplo (contraseña "123456"): laura@skillswap.co, miguel@skillswap.co, yeiron@skillswap.co, alison@skillswap.co, daniel@skillswap.co\n`);
});
