-- Migration: 001_create_interventions
-- Creates the interventions table for the Healthcare Analytics Dashboard

create table if not exists interventions (
  id                         uuid primary key default gen_random_uuid(),
  created_at                 timestamptz not null default now(),
  hospital_name              varchar not null,

  -- Core identification fields
  fecha                      varchar,
  tipo_intervencion          varchar,
  nombre                     varchar,
  admision_cedula            varchar,
  cama                       varchar,
  servicio                   varchar,
  edad                       varchar,

  -- Diagnosis fields
  cod_diagnostico            varchar,
  diagnostico                varchar,

  -- Infection-related fields
  iaas                       varchar,
  tipo_iaas                  varchar,

  -- Therapy approval fields
  aprobo_terapia             varchar,
  causa_no_aprobacion        varchar,
  combinacion_no_adecuada    varchar,
  extension_no_adecuada      varchar,

  -- Culture and correlation fields
  ajuste_por_cultivo         varchar,
  correlacion_dx_antibiotico varchar,
  terapia_empirica_apropiada varchar,
  cultivos_previos           varchar,

  -- General management
  conducta_general           varchar,

  -- Antibiotic 01
  antibiotico01              varchar,
  acciones_med01             varchar,
  dias_terapia_med01         varchar,

  -- Antibiotic 02
  antibiotico02              varchar,
  acciones_med02             varchar,
  dias_terapia_med02         varchar,

  -- Notes
  observaciones              varchar,

  -- Unique constraint for idempotent upserts
  constraint interventions_unique_record
    unique (admision_cedula, fecha, hospital_name)
);

-- Enable Row Level Security
alter table interventions enable row level security;

-- Development policy: allow all operations for authenticated and anonymous roles
create policy "allow_all_anon_and_authenticated"
  on interventions
  for all
  to anon, authenticated
  using (true)
  with check (true);
