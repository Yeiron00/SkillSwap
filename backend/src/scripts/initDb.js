// Ejecuta sql/schema.sql (y opcionalmente sql/seed.sql) contra la base configurada en DATABASE_URL.
// Uso: npm run db:init            -> solo el esquema
//      npm run db:init -- --seed  -> esquema + datos de ejemplo

const fs = require("fs");
const path = require("path");
const db = require("../db");

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, "../../sql/schema.sql"), "utf8");
  console.log("Aplicando esquema...");
  await db.query(schema);
  console.log("Esquema aplicado correctamente.");

  if (process.argv.includes("--seed")) {
    const seed = fs.readFileSync(path.join(__dirname, "../../sql/seed.sql"), "utf8");
    console.log("Insertando datos de ejemplo...");
    await db.query(seed);
    console.log("Datos de ejemplo insertados.");
  }

  await db.pool.end();
}

run().catch(err => {
  console.error("Error inicializando la base de datos:", err.message);
  process.exit(1);
});
