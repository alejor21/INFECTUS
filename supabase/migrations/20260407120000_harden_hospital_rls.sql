CREATE OR REPLACE FUNCTION public.current_user_hospital_ids()
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
AS $$
  SELECT hospitals.id
  FROM public.hospitals AS hospitals
  WHERE hospitals.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_hospital_names()
RETURNS TABLE (name text)
LANGUAGE sql
STABLE
AS $$
  SELECT hospitals.name
  FROM public.hospitals AS hospitals
  WHERE hospitals.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.safe_drop_policy(target_table_name text, policy_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  target_table regclass := to_regclass(target_table_name);
BEGIN
  IF target_table IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', policy_name, target_table);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_owned_hospital_policies(
  target_table_name text,
  hospital_column text DEFAULT 'hospital_id'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  target_table regclass := to_regclass(target_table_name);
  base_name text := replace(target_table_name, 'public.', '');
BEGIN
  IF target_table IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target_table);

  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', base_name || '_select_own_hospital', target_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', base_name || '_insert_own_hospital', target_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', base_name || '_update_own_hospital', target_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', base_name || '_delete_own_hospital', target_table);

  EXECUTE format(
    'CREATE POLICY %I ON %s FOR SELECT TO authenticated USING (%I IN (SELECT id FROM public.current_user_hospital_ids()))',
    base_name || '_select_own_hospital',
    target_table,
    hospital_column
  );
  EXECUTE format(
    'CREATE POLICY %I ON %s FOR INSERT TO authenticated WITH CHECK (%I IN (SELECT id FROM public.current_user_hospital_ids()))',
    base_name || '_insert_own_hospital',
    target_table,
    hospital_column
  );
  EXECUTE format(
    'CREATE POLICY %I ON %s FOR UPDATE TO authenticated USING (%I IN (SELECT id FROM public.current_user_hospital_ids())) WITH CHECK (%I IN (SELECT id FROM public.current_user_hospital_ids()))',
    base_name || '_update_own_hospital',
    target_table,
    hospital_column,
    hospital_column
  );
  EXECUTE format(
    'CREATE POLICY %I ON %s FOR DELETE TO authenticated USING (%I IN (SELECT id FROM public.current_user_hospital_ids()))',
    base_name || '_delete_own_hospital',
    target_table,
    hospital_column
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_joined_hospital_policies(
  target_table_name text,
  parent_table_name text,
  foreign_key_column text,
  parent_primary_key text DEFAULT 'id',
  parent_hospital_column text DEFAULT 'hospital_id'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  target_table regclass := to_regclass(target_table_name);
  parent_table regclass := to_regclass(parent_table_name);
  base_name text := replace(target_table_name, 'public.', '');
BEGIN
  IF target_table IS NULL OR parent_table IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target_table);

  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', base_name || '_select_own_hospital', target_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', base_name || '_insert_own_hospital', target_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', base_name || '_update_own_hospital', target_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', base_name || '_delete_own_hospital', target_table);

  EXECUTE format(
    'CREATE POLICY %I ON %s FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM %s parent WHERE parent.%I = %I AND parent.%I IN (SELECT id FROM public.current_user_hospital_ids())))',
    base_name || '_select_own_hospital',
    target_table,
    parent_table,
    parent_primary_key,
    foreign_key_column,
    parent_hospital_column
  );
  EXECUTE format(
    'CREATE POLICY %I ON %s FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM %s parent WHERE parent.%I = %I AND parent.%I IN (SELECT id FROM public.current_user_hospital_ids())))',
    base_name || '_insert_own_hospital',
    target_table,
    parent_table,
    parent_primary_key,
    foreign_key_column,
    parent_hospital_column
  );
  EXECUTE format(
    'CREATE POLICY %I ON %s FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM %s parent WHERE parent.%I = %I AND parent.%I IN (SELECT id FROM public.current_user_hospital_ids()))) WITH CHECK (EXISTS (SELECT 1 FROM %s parent WHERE parent.%I = %I AND parent.%I IN (SELECT id FROM public.current_user_hospital_ids())))',
    base_name || '_update_own_hospital',
    target_table,
    parent_table,
    parent_primary_key,
    foreign_key_column,
    parent_hospital_column,
    parent_table,
    parent_primary_key,
    foreign_key_column,
    parent_hospital_column
  );
  EXECUTE format(
    'CREATE POLICY %I ON %s FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM %s parent WHERE parent.%I = %I AND parent.%I IN (SELECT id FROM public.current_user_hospital_ids())))',
    base_name || '_delete_own_hospital',
    target_table,
    parent_table,
    parent_primary_key,
    foreign_key_column,
    parent_hospital_column
  );
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.interventions') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE';
  EXECUTE 'CREATE INDEX IF NOT EXISTS interventions_hospital_id_idx ON public.interventions (hospital_id)';

  UPDATE public.interventions AS interventions
  SET hospital_id = (
    SELECT hospitals.id
    FROM public.hospitals AS hospitals
    WHERE hospitals.name = interventions.hospital_name
    ORDER BY hospitals.created_at ASC
    LIMIT 1
  )
  WHERE interventions.hospital_id IS NULL;
END;
$$;

SELECT public.safe_drop_policy('public.evaluaciones', 'evaluaciones_auth');
SELECT public.safe_drop_policy('public.evaluacion_respuestas', 'evaluacion_respuestas_auth');
SELECT public.safe_drop_policy('public.instituciones', 'instituciones_auth');
SELECT public.safe_drop_policy('public.formularios', 'formularios_auth');
SELECT public.safe_drop_policy('public.ias_registros', 'ias_registros_auth');
SELECT public.safe_drop_policy('public.proa_intervenciones', 'proa_intervenciones_auth');
SELECT public.safe_drop_policy('public.configuracion_hospital', 'configuracion_hospital_auth');
SELECT public.safe_drop_policy('public.evaluaciones', 'ver evaluaciones propias');
SELECT public.safe_drop_policy('public.evaluaciones', 'insertar evaluaciones propias');
SELECT public.safe_drop_policy('public.evaluaciones', 'actualizar evaluaciones propias');
SELECT public.safe_drop_policy('public.evaluaciones', 'eliminar evaluaciones propias');
SELECT public.safe_drop_policy('public.hospital_excel_uploads', 'usuarios ven cargas de su hospital');
SELECT public.safe_drop_policy('public.hospital_excel_uploads', 'usuarios insertan cargas de su hospital');
SELECT public.safe_drop_policy('public.hospital_excel_uploads', 'usuarios actualizan sus cargas');
SELECT public.safe_drop_policy('public.hospital_excel_uploads', 'ver cargas propias');
SELECT public.safe_drop_policy('public.hospital_excel_uploads', 'insertar cargas propias');
SELECT public.safe_drop_policy('public.interventions', 'allow_all_anon_and_authenticated');

SELECT public.apply_owned_hospital_policies('public.evaluaciones');
SELECT public.apply_joined_hospital_policies('public.evaluacion_respuestas', 'public.evaluaciones', 'evaluacion_id');
SELECT public.apply_owned_hospital_policies('public.instituciones');
SELECT public.apply_owned_hospital_policies('public.formularios');
SELECT public.apply_owned_hospital_policies('public.ias_registros');
SELECT public.apply_owned_hospital_policies('public.proa_intervenciones');
SELECT public.apply_owned_hospital_policies('public.configuracion_hospital');
SELECT public.apply_owned_hospital_policies('public.hospital_excel_uploads');
SELECT public.apply_owned_hospital_policies('public.hospital_files');
SELECT public.apply_owned_hospital_policies('public.patients');
SELECT public.apply_owned_hospital_policies('public.treatment_followups');
SELECT public.apply_owned_hospital_policies('public.alerts');
SELECT public.apply_owned_hospital_policies('public.saved_reports');
SELECT public.apply_owned_hospital_policies('public.proa_evaluations');

DO $$
BEGIN
  IF to_regclass('public.interventions') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "interventions_select_own_hospital" ON public.interventions';
  EXECUTE 'DROP POLICY IF EXISTS "interventions_insert_own_hospital" ON public.interventions';
  EXECUTE 'DROP POLICY IF EXISTS "interventions_update_own_hospital" ON public.interventions';
  EXECUTE 'DROP POLICY IF EXISTS "interventions_delete_own_hospital" ON public.interventions';

  EXECUTE $policy$
    CREATE POLICY "interventions_select_own_hospital"
      ON public.interventions FOR SELECT TO authenticated
      USING (
        hospital_id IN (SELECT id FROM public.current_user_hospital_ids())
        OR (
          hospital_id IS NULL
          AND hospital_name IN (SELECT name FROM public.current_user_hospital_names())
        )
      )
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "interventions_insert_own_hospital"
      ON public.interventions FOR INSERT TO authenticated
      WITH CHECK (
        hospital_id IN (SELECT id FROM public.current_user_hospital_ids())
        OR (
          hospital_id IS NULL
          AND hospital_name IN (SELECT name FROM public.current_user_hospital_names())
        )
      )
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "interventions_update_own_hospital"
      ON public.interventions FOR UPDATE TO authenticated
      USING (
        hospital_id IN (SELECT id FROM public.current_user_hospital_ids())
        OR (
          hospital_id IS NULL
          AND hospital_name IN (SELECT name FROM public.current_user_hospital_names())
        )
      )
      WITH CHECK (
        hospital_id IN (SELECT id FROM public.current_user_hospital_ids())
        OR (
          hospital_id IS NULL
          AND hospital_name IN (SELECT name FROM public.current_user_hospital_names())
        )
      )
  $policy$;

  EXECUTE $policy$
    CREATE POLICY "interventions_delete_own_hospital"
      ON public.interventions FOR DELETE TO authenticated
      USING (
        hospital_id IN (SELECT id FROM public.current_user_hospital_ids())
        OR (
          hospital_id IS NULL
          AND hospital_name IN (SELECT name FROM public.current_user_hospital_names())
        )
      )
  $policy$;
END;
$$;

DROP FUNCTION IF EXISTS public.safe_drop_policy(text, text);
DROP FUNCTION IF EXISTS public.apply_owned_hospital_policies(text, text);
DROP FUNCTION IF EXISTS public.apply_joined_hospital_policies(text, text, text, text, text);
