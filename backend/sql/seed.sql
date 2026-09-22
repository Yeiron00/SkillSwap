-- Datos de ejemplo para SkillSwap (coinciden con los del prototipo frontend).
-- La contraseña de todos los usuarios de ejemplo es: 123456
-- (hash bcrypt generado para "123456", 10 rounds)

INSERT INTO usuarios (id, nombre, apellido, email, contrasena_hash, ciudad, descripcion) VALUES
  ('43b53c14-472a-4155-95b4-e754a6d8cb9e', 'Laura', 'C.', 'laura@skillswap.co', '$2a$10$qeQAZlqqSQVYMBLtGs1T9OJ5SYfEjO33aCTXWoohzhhRAm9yj5ZHm', 'Bogotá, Colombia', 'Profesora de inglés certificada. Me encanta ayudar a otros a perder el miedo a hablar.'),
  ('60b48db0-7ffa-48fd-b346-73b800a4c660', 'Miguel', 'R.', 'miguel@skillswap.co', '$2a$10$qeQAZlqqSQVYMBLtGs1T9OJ5SYfEjO33aCTXWoohzhhRAm9yj5ZHm', 'Medellín, Colombia', 'Ingeniero de sistemas, apasionado por enseñar programación desde cero.'),
  ('4ccfbca8-2e51-41b8-be73-9b839b6712a8', 'Yeiron', 'S.', 'yeiron@skillswap.co', '$2a$10$qeQAZlqqSQVYMBLtGs1T9OJ5SYfEjO33aCTXWoohzhhRAm9yj5ZHm', 'Bogotá, Colombia', 'Estudiante de ingeniería, me gustan las matemáticas y la geometría aplicada.'),
  ('c3e9bb8c-8eab-40b4-b99d-6dfc25aa8b99', 'Alison', 'M.', 'alison@skillswap.co', '$2a$10$qeQAZlqqSQVYMBLtGs1T9OJ5SYfEjO33aCTXWoohzhhRAm9yj5ZHm', 'Bogotá, Colombia', 'Ilustradora freelance. Logos, flyers y composición visual son mi especialidad.'),
  ('d38e911f-e271-47ab-b4aa-70c8d79df3b9', 'Daniel', 'G.', 'daniel@skillswap.co', '$2a$10$qeQAZlqqSQVYMBLtGs1T9OJ5SYfEjO33aCTXWoohzhhRAm9yj5ZHm', 'Bogotá, Colombia', 'Estudiante de ingeniería, apasionado por la tecnología y el aprendizaje colaborativo.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO habilidades (usuario_id, nombre, descripcion, categoria, nivel, tipo) VALUES
  ('43b53c14-472a-4155-95b4-e754a6d8cb9e', 'Inglés conversacional', 'Clases de inglés A2-B2, enfocadas en conversación cotidiana y pronunciación.', 'Idiomas', 'Intermedio', 'ofrecida'),
  ('60b48db0-7ffa-48fd-b346-73b800a4c660', 'Fundamentos de Python', 'Fundamentos de Python, lógica de programación y proyectos pequeños.', 'Informática', 'Principiante', 'ofrecida'),
  ('4ccfbca8-2e51-41b8-be73-9b839b6712a8', 'Matemáticas avanzadas', 'Experto en matemáticas y gráficas en el plano y en 3 dimensiones.', 'Matemáticas', 'Avanzado', 'ofrecida'),
  ('c3e9bb8c-8eab-40b4-b99d-6dfc25aa8b99', 'Illustrator y Photoshop', 'Ilustrador y Photoshop: logos, flyers y composición visual.', 'Arte', 'Avanzado', 'ofrecida'),
  ('d38e911f-e271-47ab-b4aa-70c8d79df3b9', 'Python desde cero', 'Te enseño la base de Python con ejercicios prácticos y proyectos guiados.', 'Informática', 'Principiante', 'ofrecida'),
  ('d38e911f-e271-47ab-b4aa-70c8d79df3b9', 'Excel para el trabajo', 'Fórmulas, tablas dinámicas y automatización básica de reportes en Excel.', 'Informática', 'Intermedio', 'ofrecida')
ON CONFLICT (usuario_id, nombre) DO NOTHING;
