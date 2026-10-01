const Habilidad = require("../models/Habilidad.model");
const { habilidad, habilidadConUsuario } = require("../views/habilidad.view");

// RF-05: buscar habilidades (con filtro de texto, categoría y/o dueño)
async function buscar(req, res, next) {
  try {
    const { q, categoria, usuarioId } = req.query;
    const resultados = await Habilidad.buscar({ q, categoria, usuarioId });
    res.json(resultados.map(habilidadConUsuario));
  } catch (err) {
    next(err);
  }
}

// RF-04: publicar una habilidad propia
async function publicar(req, res, next) {
  try {
    const { nombre, descripcion, categoria, nivel, tipo } = req.body;
    const nueva = await Habilidad.crear({ usuarioId: req.usuarioId, nombre, descripcion, categoria, nivel, tipo });
    res.status(201).json(habilidad(nueva));
  } catch (err) {
    next(err);
  }
}

// Editar una habilidad propia
async function actualizar(req, res, next) {
  try {
    const existente = await Habilidad.buscarPorId(req.params.id);
    if (!existente) return res.status(404).json({ error: "Habilidad no encontrada." });
    if (existente.usuario_id !== req.usuarioId) {
      return res.status(403).json({ error: "No puedes editar una habilidad que no es tuya." });
    }

    const campos = ["nombre", "descripcion", "categoria", "nivel"];
    const cambios = {};
    for (const campo of campos) {
      if (req.body[campo] !== undefined) cambios[campo] = req.body[campo];
    }
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: "No se enviaron campos para actualizar." });
    }

    const actualizada = await Habilidad.actualizar(req.params.id, cambios);
    res.json(habilidad(actualizada));
  } catch (err) {
    next(err);
  }
}

// Eliminar una habilidad propia
async function eliminar(req, res, next) {
  try {
    const existente = await Habilidad.buscarPorId(req.params.id);
    if (!existente) return res.status(404).json({ error: "Habilidad no encontrada." });
    if (existente.usuario_id !== req.usuarioId) {
      return res.status(403).json({ error: "No puedes eliminar una habilidad que no es tuya." });
    }
    await Habilidad.eliminar(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { buscar, publicar, actualizar, eliminar };
