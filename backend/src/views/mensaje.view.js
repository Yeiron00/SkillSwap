// Vista: da forma a la respuesta JSON de un mensaje y de una conversación.

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

function conversacionResumen(c) {
  return {
    usuarioId: c.interlocutor_id,
    nombre: c.nombre,
    apellido: c.apellido,
    ciudad: c.ciudad,
    ultimoMensaje: c.ultimo_mensaje,
    fecha: c.fecha_envio
  };
}

module.exports = { mensaje, conversacionResumen };
