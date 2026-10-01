// Vista: da forma a la respuesta JSON de una habilidad.

function habilidad(h) {
  return {
    id: h.id,
    usuarioId: h.usuario_id,
    nombre: h.nombre,
    descripcion: h.descripcion,
    categoria: h.categoria,
    nivel: h.nivel,
    tipo: h.tipo,
    fechaPublicacion: h.fecha_publicacion
  };
}

// Para el listado de búsqueda (RF-05), que viene con los datos del dueño ya unidos (JOIN).
function habilidadConUsuario(h) {
  return {
    ...habilidad(h),
    usuario: { nombre: h.usuario_nombre, apellido: h.usuario_apellido, ciudad: h.usuario_ciudad }
  };
}

module.exports = { habilidad, habilidadConUsuario };
