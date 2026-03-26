-- Tabla para registrar las cargas de Excel por hospital
CREATE TABLE IF NOT EXISTS public.hospital_excel_uploads (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id   UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  periodo       TEXT,
  mes           INTEGER,
  anio          INTEGER,
  total_filas   INTEGER DEFAULT 0,
  filas_validas INTEGER DEFAULT 0,
  filas_error   INTEGER DEFAULT 0,
  estado        TEXT DEFAULT 'procesando'
                CHECK (estado IN ('procesando', 'completado', 'error')),
  errores       JSONB DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_excel_uploads_hospital
  ON public.hospital_excel_uploads(hospital_id);

CREATE INDEX IF NOT EXISTS idx_excel_uploads_created
  ON public.hospital_excel_uploads(created_at DESC);

ALTER TABLE public.hospital_excel_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios ven cargas de su hospital"
  ON public.hospital_excel_uploads
  FOR SELECT
  USING (
    hospital_id IN (
      SELECT id FROM public.hospitals
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "usuarios insertan cargas de su hospital"
  ON public.hospital_excel_uploads
  FOR INSERT
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM public.hospitals
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "usuarios actualizan sus cargas"
  ON public.hospital_excel_uploads
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.hospital_excel_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
