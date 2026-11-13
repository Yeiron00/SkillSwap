const { Pool } = require("pg");
const config = require("./config");

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: /render|railway|neon|supabase|sslmode=require/i.test(config.databaseUrl || "")
    ? { rejectUnauthorized: false }
    : false
});

// Neon/Render pueden cerrar conexiones inactivas. Sin este manejador, el error de un
// cliente en reposo tumba el proceso; así solo se registra y el pool abre otra conexión.
pool.on("error", (err) => {
  console.error("Conexión inactiva de PostgreSQL cerrada:", err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
