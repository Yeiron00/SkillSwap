const { verificarToken } = require("../utils/jwt");

// RF-02: valida el JWT enviado en el header Authorization: Bearer <token>
function requiereAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "No autenticado. Falta el token de sesión." });
  }
  try {
    const payload = verificarToken(token);
    req.usuarioId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sesión inválida o expirada." });
  }
}

module.exports = { requiereAuth };
