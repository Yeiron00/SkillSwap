// Pruebas del motor del chatbot de soporte. Ejecutar con: npm run test:soporte
const test = require("node:test");
const assert = require("node:assert");
const Soporte = require("../src/models/Soporte.model");

const casos = [
  ["hola", "saludo"],
  ["buenas tardes", "saludo"],
  ["como me registro", "registro"],
  ["quiero crear una cuenta nueva", "registro"],
  ["no puedo iniciar sesion", "login"],
  ["se me olvidó la contraseña", "contrasena"],
  ["como publico una habilidad", "publicar"],
  ["quiero ofrecer mis clases de guitarra", "publicar"],
  ["donde busco habilidades por categoria", "buscar"],
  ["como pido un intercambio", "solicitar"],
  ["como solicito un intercambio", "solicitar"],
  ["como envio una solicitud", "solicitar"],
  ["como acepto una solicitud", "gestionar-solicitudes"],
  ["como marco el intercambio como terminado", "completar"],
  ["como califico a alguien", "calificar"],
  ["como le escribo a otro usuario", "mensajes"],
  ["quiero cambiar mi ciudad en el perfil", "perfil"],
  ["como cierro sesión", "salir"],
  ["cuanto cuesta", "costo"],
  ["como instalo la app en el celular", "instalar"],
  ["mis datos estan seguros?", "privacidad"],
  ["la pagina no carga", "error"],
  ["gracias", "despedida"],
  ["cual es la capital de francia", "desconocido"],
  ["asdkjasd", "desconocido"]
];

for (const [pregunta, esperado] of casos) {
  test(`"${pregunta}" -> ${esperado}`, () => {
    const r = Soporte.buscarRespuesta(pregunta);
    const obtenido = r.tipo === "faq" ? r.id : r.tipo;
    assert.strictEqual(obtenido, esperado);
  });
}

test("toda respuesta incluye texto y sugerencias como arreglo", () => {
  for (const [pregunta] of casos) {
    const r = Soporte.buscarRespuesta(pregunta);
    assert.ok(typeof r.respuesta === "string" && r.respuesta.length > 0);
    assert.ok(Array.isArray(r.sugerencias));
  }
});
