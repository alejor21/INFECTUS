ALTER TABLE public.evaluaciones
  ADD COLUMN IF NOT EXISTS fecha DATE,
  ADD COLUMN IF NOT EXISTS tipo_intervencion TEXT,
  ADD COLUMN IF NOT EXISTS nombre_paciente TEXT,
  ADD COLUMN IF NOT EXISTS cedula TEXT,
  ADD COLUMN IF NOT EXISTS cama TEXT,
  ADD COLUMN IF NOT EXISTS servicio TEXT,
  ADD COLUMN IF NOT EXISTS edad INTEGER,
  ADD COLUMN IF NOT EXISTS cod_diagnostico TEXT,
  ADD COLUMN IF NOT EXISTS diagnostico TEXT,
  ADD COLUMN IF NOT EXISTS iaas BOOLEAN,
  ADD COLUMN IF NOT EXISTS tipo_iaas TEXT,
  ADD COLUMN IF NOT EXISTS aprobacion_terapia BOOLEAN,
  ADD COLUMN IF NOT EXISTS causa_no_aprobacion TEXT,
  ADD COLUMN IF NOT EXISTS combinacion_no_adecuada BOOLEAN,
  ADD COLUMN IF NOT EXISTS extension_no_adecuada BOOLEAN,
  ADD COLUMN IF NOT EXISTS ajuste_cultivo BOOLEAN,
  ADD COLUMN IF NOT EXISTS dx_correlacionado BOOLEAN,
  ADD COLUMN IF NOT EXISTS terapia_empirica BOOLEAN,
  ADD COLUMN IF NOT EXISTS cultivos_previos BOOLEAN,
  ADD COLUMN IF NOT EXISTS conducta_general TEXT,
  ADD COLUMN IF NOT EXISTS antibiotico_01 TEXT,
  ADD COLUMN IF NOT EXISTS acciones_medicamento_01 TEXT,
  ADD COLUMN IF NOT EXISTS dias_terapia_01 INTEGER,
  ADD COLUMN IF NOT EXISTS antibiotico_02 TEXT,
  ADD COLUMN IF NOT EXISTS acciones_medicamento_02 TEXT,
  ADD COLUMN IF NOT EXISTS dias_terapia_02 INTEGER,
  ADD COLUMN IF NOT EXISTS observaciones TEXT,
  ADD COLUMN IF NOT EXISTS mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS anio INTEGER CHECK (anio BETWEEN 2000 AND 2100);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_hospital_mes_anio
  ON public.evaluaciones(hospital_id, anio, mes);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_aprobacion
  ON public.evaluaciones(hospital_id, aprobacion_terapia);
