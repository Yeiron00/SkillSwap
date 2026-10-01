const Usuario = require("../models/Usuario.model");
const Habilidad = require("../models/Habilidad.model");
const Calificacion = require("../models/Calificacion.model");
const { usuarioPublico, perfilPublico } = require("../views/usuario.view");

// RF-03: obtener mi perfil
async function obtenerMiPerfil(req, res, next) {
  try {
    const usuario = await Usuario.buscarPorId(req.usuarioId);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json(usuarioPublico(usuario));
  } catch (err) {
    next(err);
  }
}

// RF-03: editar mi perfil
async function actualizarMiPerfil(req, res, next) {
  try {
    const columnas = { nombre: "nombre", apellido: "apellido", ciudad: "ciudad", descripcion: "descripcion", fotoPerfil: "foto_perfil" };
    const cambios = {};
    for (const [campo, columna] of Object.entries(columnas)) {
      if (req.body[campo] !== undefined) cambios[columna] = req.body[campo];
    }
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: "No se enviaron campos para actualizar." });
    }
    const usuario = await Usuario.actualizarPerfil(req.usuarioId, cambios);
    res.json(usuarioPublico(usuario));
  } catch (err) {
    next(err);
  }
}

// RF-06: ver el perfil público de otro usuario, con sus habilidades y calificaciones
async function obtenerPerfilPublico(req, res, next) {
  try {
    const usuario = await Usuario.buscarPublicoPorId(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado." });

    const [habilidades, calificaciones, { promedio, total }, intercambiosCompletados] = await Promise.all([
      Habilidad.buscarPorUsuario(req.params.id),
      Calificacion.listarPorUsuarioCalificado(req.params.id),
      Calificacion.promedioYTotal(req.params.id),
      Usuario.contarIntercambiosCompletados(req.params.id)
    ]);

    res.json(perfilPublico(usuario, { habilidades, calificaciones, promedio, total, intercambiosCompletados }));
  } catch (err) {
    next(err);
  }
}

module.exports = { obtenerMiPerfil, actualizarMiPerfil, obtenerPerfilPublico };
