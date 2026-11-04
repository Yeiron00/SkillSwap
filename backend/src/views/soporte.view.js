// Vista: da forma a la respuesta JSON del chatbot de soporte.

function respuestaBot(r) {
  return {
    tipo: r.tipo,
    respuesta: r.respuesta,
    sugerencias: r.sugerencias || []
  };
}

module.exports = { respuestaBot };
