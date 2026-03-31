ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS user_id UUID
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ver propios hospitales"        ON public.hospitals;
DROP POLICY IF EXISTS "insertar propios hospitales"   ON public.hospitals;
DROP POLICY IF EXISTS "actualizar propios hospitales" ON public.hospitals;
DROP POLICY IF EXISTS "eliminar propios hospitales"   ON public.hospitals;

CREATE POLICY "ver propios hospitales"
  ON public.hospitals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "insertar propios hospitales"
  ON public.hospitals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "actualizar propios hospitales"
  ON public.hospitals FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "eliminar propios hospitales"
  ON public.hospitals FOR DELETE
  USING (user_id = auth.uid());

ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evaluaciones_auth"                ON public.evaluaciones;
DROP POLICY IF EXISTS "ver evaluaciones propias"         ON public.evaluaciones;
DROP POLICY IF EXISTS "insertar evaluaciones propias"    ON public.evaluaciones;
DROP POLICY IF EXISTS "actualizar evaluaciones propias"  ON public.evaluaciones;
DROP POLICY IF EXISTS "eliminar evaluaciones propias"    ON public.evaluaciones;

CREATE POLICY "ver evaluaciones propias"
  ON public.evaluaciones FOR SELECT
  USING (hospital_id IN (
    SELECT id FROM public.hospitals WHERE user_id = auth.uid()
  ));

CREATE POLICY "insertar evaluaciones propias"
  ON public.evaluaciones FOR INSERT
  WITH CHECK (hospital_id IN (
    SELECT id FROM public.hospitals WHERE user_id = auth.uid()
  ));

CREATE POLICY "actualizar evaluaciones propias"
  ON public.evaluaciones FOR UPDATE
  USING (hospital_id IN (
    SELECT id FROM public.hospitals WHERE user_id = auth.uid()
  ));

CREATE POLICY "eliminar evaluaciones propias"
  ON public.evaluaciones FOR DELETE
  USING (hospital_id IN (
    SELECT id FROM public.hospitals WHERE user_id = auth.uid()
  ));

ALTER TABLE public.hospital_excel_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios ven cargas de su hospital" ON public.hospital_excel_uploads;
DROP POLICY IF EXISTS "usuarios insertan cargas de su hospital" ON public.hospital_excel_uploads;
DROP POLICY IF EXISTS "ver cargas propias"      ON public.hospital_excel_uploads;
DROP POLICY IF EXISTS "insertar cargas propias" ON public.hospital_excel_uploads;

CREATE POLICY "ver cargas propias"
  ON public.hospital_excel_uploads FOR SELECT
  USING (hospital_id IN (
    SELECT id FROM public.hospitals WHERE user_id = auth.uid()
  ));

CREATE POLICY "insertar cargas propias"
  ON public.hospital_excel_uploads FOR INSERT
  WITH CHECK (hospital_id IN (
    SELECT id FROM public.hospitals WHERE user_id = auth.uid()
  ));
