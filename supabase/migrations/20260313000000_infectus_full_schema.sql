-- ============================================================
-- Infectus Analytics — Full Schema Migration
-- Created: 2026-03-13
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── EVALUACIONES (draft / completed / archived tracking) ───

CREATE TABLE IF NOT EXISTS evaluaciones (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id          uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  hospital_name        text NOT NULL,
  evaluator_name       text,
  evaluation_date      date NOT NULL DEFAULT CURRENT_DATE,
  status               text NOT NULL DEFAULT 'borrador'
                         CHECK (status IN ('borrador', 'completada', 'archivada')),
  proa_evaluation_id   uuid REFERENCES proa_evaluations(id) ON DELETE SET NULL,
  total_score          integer,
  level                text CHECK (level IN ('avanzado', 'basico', 'inadecuado')),
  progress_pct         integer DEFAULT 0,
  observations         text,
  created_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evaluaciones_hospital_id_idx ON evaluaciones (hospital_id);
CREATE INDEX IF NOT EXISTS evaluaciones_created_by_idx  ON evaluaciones (created_by);
CREATE INDEX IF NOT EXISTS evaluaciones_status_idx      ON evaluaciones (status);

-- ─── EVALUACION_RESPUESTAS (per-item autosave for drafts) ───

CREATE TABLE IF NOT EXISTS evaluacion_respuestas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id   uuid NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  item_key        text NOT NULL,
  value           text NOT NULL CHECK (value IN ('SI', 'NO', 'NO_APLICA')),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (evaluacion_id, item_key)
);

CREATE INDEX IF NOT EXISTS evaluacion_respuestas_eval_idx
  ON evaluacion_respuestas (evaluacion_id);

-- ─── INSTITUCIONES ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS instituciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  nombre      text NOT NULL,
  ciudad      text,
  tipo        text DEFAULT 'IPS',
  nivel       text DEFAULT 'II',
  camas       integer DEFAULT 0,
  telefono    text,
  email       text,
  activo      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instituciones_hospital_id_idx ON instituciones (hospital_id);

-- ─── FORMULARIOS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS formularios (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id  uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  categoria    text NOT NULL CHECK (categoria IN ('PROA', 'IAS')),
  descripcion  text,
  estado       text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'borrador')),
  enviados     integer DEFAULT 0,
  pendientes   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS formularios_hospital_id_idx ON formularios (hospital_id);

-- ─── IAS_REGISTROS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ias_registros (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  paciente        text,
  cama            text,
  servicio        text,
  tipo_iaas       text,
  microorganismo  text,
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  estado          text NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'resuelto', 'seguimiento')),
  observaciones   text,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ias_registros_hospital_id_idx ON ias_registros (hospital_id);
CREATE INDEX IF NOT EXISTS ias_registros_fecha_idx       ON ias_registros (fecha);

-- ─── PROA_INTERVENCIONES ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS proa_intervenciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id   uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  paciente      text,
  servicio      text,
  tipo          text NOT NULL
                  CHECK (tipo IN ('preautorizacion', 'auditoria', 'educacion', 'otro')),
  antibiotico   text,
  diagnostico   text,
  aprobado      boolean,
  observaciones text,
  fecha         date NOT NULL DEFAULT CURRENT_DATE,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proa_intervenciones_hospital_id_idx
  ON proa_intervenciones (hospital_id);
CREATE INDEX IF NOT EXISTS proa_intervenciones_fecha_idx
  ON proa_intervenciones (fecha);

-- ─── CONFIGURACION_HOSPITAL ──────────────────────────────────

CREATE TABLE IF NOT EXISTS configuracion_hospital (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id            uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  nombre_programa        text DEFAULT 'PROA',
  responsable            text,
  email_notificaciones   text,
  notif_email            boolean DEFAULT true,
  notif_alertas          boolean DEFAULT true,
  notif_cumplimiento     boolean DEFAULT true,
  notif_semanal          boolean DEFAULT false,
  zona_horaria           text DEFAULT 'America/Bogota',
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE (hospital_id)
);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER evaluaciones_updated_at
  BEFORE UPDATE ON evaluaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER evaluacion_respuestas_updated_at
  BEFORE UPDATE ON evaluacion_respuestas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER instituciones_updated_at
  BEFORE UPDATE ON instituciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER formularios_updated_at
  BEFORE UPDATE ON formularios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER ias_registros_updated_at
  BEFORE UPDATE ON ias_registros
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER configuracion_hospital_updated_at
  BEFORE UPDATE ON configuracion_hospital
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE evaluaciones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluacion_respuestas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE instituciones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ias_registros           ENABLE ROW LEVEL SECURITY;
ALTER TABLE proa_intervenciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_hospital  ENABLE ROW LEVEL SECURITY;

-- Authenticated users can CRUD all rows in each table

CREATE POLICY "evaluaciones_auth" ON evaluaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "evaluacion_respuestas_auth" ON evaluacion_respuestas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "instituciones_auth" ON instituciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "formularios_auth" ON formularios
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "ias_registros_auth" ON ias_registros
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "proa_intervenciones_auth" ON proa_intervenciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "configuracion_hospital_auth" ON configuracion_hospital
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
