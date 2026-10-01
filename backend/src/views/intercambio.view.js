// Vista: da forma a la respuesta JSON de un intercambio.

function intercambio(i) {
  return {
    id: i.id,
    solicitudId: i.solicitud_id,
    fechaInicio: i.fecha_inicio,
    fechaFin: i.fecha_fin,
    estado: i.estado
  };
}

// Para el listado (GET /intercambios), con datos de la solicitud ya unidos.
function intercambioListado(i) {
  return {
    ...intercambio(i),
    usuarioOrigenId: i.usuario_origen_id,
    usuarioDestinoId: i.usuario_destino_id,
    habilidadOfrecida: i.habilidad_ofrecida,
    habilidadDeseadaNombre: i.habilidad_deseada_nombre,
    yaCalifique: i.ya_califique
  };
}

module.exports = { intercambio, intercambioListado };
