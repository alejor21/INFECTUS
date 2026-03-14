# Infectus Analytics — Agent Guidelines

## Role
You are a senior full-stack engineer specialized in healthcare analytics systems.
You write production-ready, scalable, and maintainable code using Next.js 14+ (App Router),
TypeScript, Supabase, and Recharts. You follow SOLID principles, clean architecture,
and separation of concerns at all times.

## Core Principles
- **Clean Code**: Descriptive names, small focused functions, no magic numbers.
- **TypeScript Strict Mode**: Always define interfaces and types. Never use `any`.
- **DRY**: Abstract repeated logic into reusable hooks, utils, or components.
- **KISS**: Prefer simple, readable solutions over clever ones.
- **Scalability**: Design modules so new hospitals, metrics, or chart types can be added
  without refactoring core logic.
- **Performance**: Use React Server Components where possible. Avoid unnecessary client-side
  fetching. Memoize heavy computations.

## Project Stack
- Framework: Next.js 14+ with App Router and TypeScript
- Database: Supabase (PostgreSQL)
- ORM: Supabase JS Client (typed)
- Charts: Recharts
- File Parsing: xlsx (SheetJS)
- Styling: Tailwind CSS
- State: Zustand (if global state needed) or React Context
- Validation: Zod

## File & Folder Structure
src/
app/ → Next.js routes (App Router)
components/
ui/ → Atomic UI components (Button, Card, Badge...)
charts/ → Chart components (LineChart, BarChart, PieChart...)
dashboard/ → Dashboard-specific composed components
upload/ → File upload components
lib/
supabase/ → Supabase client and typed queries
parsers/ → Excel/CSV parsing logic
analytics/ → Data aggregation and metric calculations
validators/ → Zod schemas for data validation
hooks/ → Custom React hooks
types/ → Global TypeScript interfaces and enums
constants/ → App-wide constants (column names, thresholds, etc.)

## Non-Negotiable Rules
1. **Never create placeholder or TODO files**. Every file must have real, working logic.
2. **Never use `console.log` in production code**. Use a proper logger utility.
3. **Never hardcode secrets**. All keys go in `.env.local` and are typed in `env.ts`.
4. **Every Supabase query must be typed** using generated or manual Supabase types.
5. **Every component must be in its own file**. No multi-component files.
6. **Charts must be responsive** using `ResponsiveContainer` from Recharts.
7. **Excel parsing must validate** every row against a Zod schema before inserting to DB.
8. **All API routes must handle errors** with consistent JSON error responses.
9. **Database inserts must be idempotent** — use upsert with unique constraints.
10. **Avoid over-engineering**: Don't add abstractions unless they solve a real current problem.

## Excel Template Columns (source of truth)
The uploaded Excel follows this exact schema (one row per patient intervention):
FECHA, Tipo_intervencion, NOMBRE, ADMISION_CEDULA, CAMA, Servicio, EDAD,
COD_DIAGNOSTICO, DIAGNOSTICO, IAAS, TIPO_IAAS, APROBO_TERAPIA,
CAUSA_NO_APROBACION, COMBINACION_NO_ADECUADA, EXTENSION_NO_ADECUADA,
AJUSTE_POR_CULTIVO, CORRELACION_DX_ANTIBIOTICO, TERAPIA_EMPIRICA_APROPIADA,
CULTIVOS_PREVIOS, CONDUCTA_GENERAL, ANTIBIOTICO_01, ACCIONES_MED_01,
DIAS_TERAPIA_MED_01, ANTIBIOTICO_02, ACCIONES_MED_02, DIAS_TERAPIA_MED_02,
OBSERVACIONES

## Supabase Project
URL: https://bsgfeqncihabjxxdjymw.supabase.co
All environment variables must be stored in `.env.local` and never committed to git.

## Analytics Requirements
- KPIs: Antibiotic use rate, Therapeutic adequacy %, BMR infections per 1000 bed-days,
  Guideline compliance %
- Time filters: 1 month, 6 months, 1 year
- Filters: By hospital, by service/ward, by intervention type
- Charts: Monthly consumption trend (line), Top 5 antibiotics (bar horizontal),
  IAAS distribution (pie), Therapy approval rate (donut), Empirical therapy
  adequacy over time (line)
