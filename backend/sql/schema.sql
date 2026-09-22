-- SkillSwap · Esquema de base de datos (PostgreSQL)
-- Basado en el diagrama de clases y el diagrama de estado del documento de metodología.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(80)  NOT NULL,
  apellido        VARCHAR(80)  NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  contrasena_hash TEXT         NOT NULL,
  ciudad          VARCHAR(120) DEFAULT '',
  foto_perfil     TEXT         DEFAULT NULL,
  descripcion     TEXT         DEFAULT '',
  fecha_registro  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  activo          BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS habilidades (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre              VARCHAR(120) NOT NULL,
  descripcion         TEXT NOT NULL,
  categoria           VARCHAR(60)  NOT NULL,
  nivel               VARCHAR(20)  NOT NULL DEFAULT 'Principiante'
                        CHECK (nivel IN ('Principiante', 'Intermedio', 'Avanzado')),
  tipo                VARCHAR(20)  NOT NULL DEFAULT 'ofrecida'
                        CHECK (tipo IN ('ofrecida', 'deseada')),
  fecha_publicacion   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habilidades_usuario ON habilidades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_habilidades_categoria ON habilidades(categoria);
-- Evita duplicados cuando sql/seed.sql se ejecuta más de una vez (p. ej. en cada build de despliegue).
CREATE UNIQUE INDEX IF NOT EXISTS idx_habilidades_usuario_nombre_unico ON habilidades(usuario_id, nombre);

CREATE TABLE IF NOT EXISTS solicitudes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_origen_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_destino_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  habilidad_ofrecida    VARCHAR(120) NOT NULL,
  habilidad_deseada_id  UUID NOT NULL REFERENCES habilidades(id) ON DELETE CASCADE,
  mensaje               TEXT DEFAULT '',
  estado                VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  fecha_envio           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (usuario_origen_id <> usuario_destino_id)
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_destino ON solicitudes(usuario_destino_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_origen ON solicitudes(usuario_origen_id);

-- Ciclo de vida según el diagrama de estado del documento:
-- pendiente -> aceptada (en curso) -> completada (pendiente de calificación) -> finalizada (calificada)
-- con ramas de cancelación: cancelada_solicitante | cancelada_mutuo | cancelada_incumplimiento
CREATE TABLE IF NOT EXISTS intercambios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id  UUID NOT NULL UNIQUE REFERENCES solicitudes(id) ON DELETE CASCADE,
  fecha_inicio  TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin     TIMESTAMPTZ,
  estado        VARCHAR(30) NOT NULL DEFAULT 'en_curso'
                  CHECK (estado IN (
                    'en_curso', 'completada', 'finalizada',
                    'cancelada_solicitante', 'cancelada_mutuo', 'cancelada_incumplimiento'
                  ))
);

CREATE TABLE IF NOT EXISTS mensajes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remitente_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido       TEXT NOT NULL,
  fecha_envio     TIMESTAMPTZ NOT NULL DEFAULT now(),
  leido           BOOLEAN NOT NULL DEFAULT false,
  CHECK (remitente_id <> destinatario_id)
);

CREATE INDEX IF NOT EXISTS idx_mensajes_par ON mensajes(remitente_id, destinatario_id);

CREATE TABLE IF NOT EXISTS calificaciones (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intercambio_id        UUID NOT NULL REFERENCES intercambios(id) ON DELETE CASCADE,
  usuario_calificado_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_calificador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  puntuacion            SMALLINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario             TEXT DEFAULT '',
  fecha                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (intercambio_id, usuario_calificador_id)
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_usuario ON calificaciones(usuario_calificado_id);
