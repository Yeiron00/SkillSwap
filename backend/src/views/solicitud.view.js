// Vista: da forma a la respuesta JSON de una solicitud de intercambio.

function solicitud(s) {
  return {
    id: s.id,
    usuarioOrigenId: s.usuario_origen_id,
    usuarioDestinoId: s.usuario_destino_id,
    habilidadOfrecida: s.habilidad_ofrecida,
    habilidadDeseadaId: s.habilidad_deseada_id,
    mensaje: s.mensaje,
    estado: s.estado,
    fechaEnvio: s.fecha_envio
  };
}

// Para el listado (RF-09), que viene con los nombres de origen/destino/habilidad ya unidos.
function solicitudListado(s) {
  return {
    ...solicitud(s),
    habilidadDeseadaNombre: s.habilidad_deseada_nombre,
    origen: { nombre: s.origen_nombre, apellido: s.origen_apellido },
    destino: { nombre: s.destino_nombre, apellido: s.destino_apellido }
  };
}

module.exports = { solicitud, solicitudListado };
