// Vista: da forma a la respuesta JSON de una calificación.

function calificacion(c) {
  return {
    id: c.id,
    intercambioId: c.intercambio_id,
    usuarioCalificadoId: c.usuario_calificado_id,
    usuarioCalificadorId: c.usuario_calificador_id,
    puntuacion: c.puntuacion,
    comentario: c.comentario,
    fecha: c.fecha
  };
}

// Para el listado en el perfil público, con el nombre del calificador ya unido.
function calificacionConCalificador(c) {
  return { ...calificacion(c), calificadorNombre: c.calificador_nombre };
}

module.exports = { calificacion, calificacionConCalificador };
