const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario.model");
const { firmarToken } = require("../utils/jwt");
const { usuarioPublico } = require("../views/usuario.view");

// RF-01: Registro de usuarios
async function registrar(req, res, next) {
  try {
    const { nombre, apellido, email, contrasena, ciudad } = req.body;

    const existente = await Usuario.buscarPorEmail(email);
    if (existente) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    const usuario = await Usuario.crear({ nombre, apellido, email, contrasenaHash, ciudad });
    const token = firmarToken({ sub: usuario.id });
    res.status(201).json({ token, usuario: usuarioPublico(usuario) });
  } catch (err) {
    next(err);
  }
}

// RF-02: Inicio de sesión
async function login(req, res, next) {
  try {
    const { email, contrasena } = req.body;
    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!coincide) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }
    const token = firmarToken({ sub: usuario.id });
    res.json({ token, usuario: usuarioPublico(usuario) });
  } catch (err) {
    next(err);
  }
}

// RF-02: Cierre de sesión (JWT es stateless: el cliente simplemente descarta el token)
function logout(req, res) {
  res.json({ mensaje: "Sesión cerrada." });
}

module.exports = { registrar, login, logout };
