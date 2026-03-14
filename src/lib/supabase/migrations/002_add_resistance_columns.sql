-- Migration 002: Add resistance / microbiology columns to interventions table
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS resultado_cultivo varchar;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS tipo_muestra varchar;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS organismo_aislado varchar;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS blee varchar;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS carbapenemasa varchar;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS mrsa varchar;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS sensibilidad_vancomicina varchar;
ALTER TABLE interventions ADD COLUMN IF NOT EXISTS sensibilidad_meropenem varchar;
