// Convierte filas de la BD (snake_case, con campos sensibles) al formato que expone la API.

function usuarioPublico(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    ciudad: u.ciudad,
    fotoPerfil: u.foto_perfil,
    descripcion: u.descripcion,
    fechaRegistro: u.fecha_registro
  };
}

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

function intercambio(i) {
  return {
    id: i.id,
    solicitudId: i.solicitud_id,
    fechaInicio: i.fecha_inicio,
    fechaFin: i.fecha_fin,
    estado: i.estado
  };
}

function mensaje(m) {
  return {
    id: m.id,
    remitenteId: m.remitente_id,
    destinatarioId: m.destinatario_id,
    contenido: m.contenido,
    fechaEnvio: m.fecha_envio,
    leido: m.leido
  };
}

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

module.exports = { usuarioPublico, habilidad, solicitud, intercambio, mensaje, calificacion };
