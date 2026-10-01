// Vista: da forma a la respuesta JSON de un usuario. Nunca expone contrasena_hash.

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

// Perfil público completo: usuario + sus habilidades + calificaciones recibidas + estadísticas.
function perfilPublico(usuario, { habilidades, calificaciones, promedio, total, intercambiosCompletados }) {
  const { habilidad } = require("./habilidad.view");
  const { calificacionConCalificador } = require("./calificacion.view");
  return {
    ...usuarioPublico(usuario),
    habilidades: habilidades.map(habilidad),
    calificaciones: calificaciones.map(calificacionConCalificador),
    calificacionPromedio: promedio,
    calificacionTotal: total,
    intercambiosCompletados
  };
}

module.exports = { usuarioPublico, perfilPublico };
