// Manejador de errores centralizado. Evita filtrar detalles internos en producción
// y traduce violaciones comunes de PostgreSQL a respuestas HTTP claras.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);

  if (err.code === "23505") { // unique_violation
    return res.status(409).json({ error: "El recurso ya existe." });
  }
  if (err.code === "23503") { // foreign_key_violation
    return res.status(400).json({ error: "Referencia inválida a un recurso relacionado." });
  }
  if (err.code === "22P02") { // invalid_text_representation (p. ej. UUID mal formado)
    return res.status(400).json({ error: "Identificador con formato inválido." });
  }

  res.status(err.status || 500).json({ error: err.publicMessage || "Error interno del servidor." });
}

module.exports = { errorHandler };
