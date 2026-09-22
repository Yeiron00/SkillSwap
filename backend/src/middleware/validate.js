const { validationResult } = require("express-validator");

// Corta la petición con 400 si express-validator encontró errores en las reglas previas.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Datos inválidos", detalles: errors.array() });
  }
  next();
}

module.exports = { validate };
