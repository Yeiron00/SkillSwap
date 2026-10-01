const Habilidad = require("../models/Habilidad.model");

// RF-07: emparejar usuarios con intereses compatibles.
// Heurística simple: usuarios que publican habilidades en categorías donde yo también publico
// (interés compartido), ordenados por cantidad de categorías en común.
async function listar(req, res, next) {
  try {
    const categorias = await Habilidad.categoriasDeUsuario(req.usuarioId);
    if (categorias.length === 0) return res.json([]);

    const candidatos = await Habilidad.usuariosConCategoriasCompartidas(req.usuarioId, categorias);
    const total = categorias.length;

    res.json(candidatos.map(c => ({
      id: c.id,
      nombre: c.nombre,
      apellido: c.apellido,
      ciudad: c.ciudad,
      descripcion: c.descripcion,
      habilidades: c.habilidades,
      porcentajeCompatibilidad: Math.round((c.categorias_compartidas / total) * 100)
    })));
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
