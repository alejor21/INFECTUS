import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Building2, Camera, Globe, KeyRound, Loader2, Lock, Mail, Moon, ShieldAlert, Sun, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { DataManagementPanel } from '../../components/DataManagementPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useAuth, type Profile } from '../../contexts/AuthContext';
import { useHospitalContext } from '../../contexts/HospitalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getAllProfiles, inviteUser, updateCurrentUserMetadata, updatePassword, updateProfile } from '../../lib/supabase/auth';
import { updateHospitalWithReferences } from '../../lib/supabase/hospitals';
import { resetWelcome } from '../components/WelcomeModal';

type UserRole = Profile['role'];
type ThemePreference = 'light' | 'dark';

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900';
const inputClassName = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100';
const readOnlyClassName = `${inputClassName} bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400`;
const primaryButtonClassName = 'inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClassName = 'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800';
const dangerButtonClassName = 'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60';

const roleLabels: Record<UserRole, string> = {
  administrador: 'Administrador',
  infectologo: 'Infectólogo',
  medico: 'Médico',
  visor: 'Visor',
};

const roleOptions: UserRole[] = ['administrador', 'infectologo', 'medico', 'visor'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readMetadataString(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === 'string' ? value : '';
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.readAsDataURL(file);
  });
}

function SettingsCard({ title, description, badge, children }: { title: string; description: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className={cardClassName}>
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function Configuracion() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, loading: authLoading, isAdmin, refreshProfile } = useAuth();
  const { selectedHospitalObj, setSelectedHospitalObj, refreshHospitals } = useHospitalContext();
  const { theme, setTheme } = useTheme();
  const userMetadata = isRecord(user?.user_metadata) ? user.user_metadata : {};

  const [profileName, setProfileName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFileName, setAvatarFileName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [hospitalName, setHospitalName] = useState('');
  const [hospitalCity, setHospitalCity] = useState('');
  const [hospitalDepartment, setHospitalDepartment] = useState('');
  const [hospitalBeds, setHospitalBeds] = useState('');
  const [hospitalContactName, setHospitalContactName] = useState('');
  const [hospitalContactEmail, setHospitalContactEmail] = useState('');
  const [hospitalIsActive, setHospitalIsActive] = useState(true);
  const [hospitalSaving, setHospitalSaving] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('medico');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const [roleSavingUserId, setRoleSavingUserId] = useState<string | null>(null);
  const [deactivateCandidate, setDeactivateCandidate] = useState<Profile | null>(null);
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  const [themeDraft, setThemeDraft] = useState<ThemePreference>(theme);
  const [preferencesSaving, setPreferencesSaving] = useState(false);

  useEffect(() => {
    setProfileName(profile?.full_name ?? '');
    setJobTitle(readMetadataString(userMetadata, 'job_title'));
    setAvatarPreview(readMetadataString(userMetadata, 'avatar_data_url'));
    setAvatarFileName(readMetadataString(userMetadata, 'avatar_file_name'));
  }, [profile, userMetadata]);

  useEffect(() => {
    setHospitalName(selectedHospitalObj?.name ?? '');
    setHospitalCity(selectedHospitalObj?.city ?? '');
    setHospitalDepartment(selectedHospitalObj?.department ?? '');
    setHospitalBeds(selectedHospitalObj?.beds != null ? String(selectedHospitalObj.beds) : '');
    setHospitalContactName(selectedHospitalObj?.contact_name ?? '');
    setHospitalContactEmail(selectedHospitalObj?.contact_email ?? '');
    setHospitalIsActive(selectedHospitalObj?.is_active ?? true);
  }, [selectedHospitalObj]);

  useEffect(() => {
    setThemeDraft(theme);
  }, [theme]);

  const loadProfiles = useCallback(async () => {
    if (!isAdmin) {
      setProfiles([]);
      return;
    }

    setLoadingUsers(true);
    try {
      setProfiles(await getAllProfiles());
    } catch (errorValue: unknown) {
      toast.error(errorValue instanceof Error ? errorValue.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const hospitalUsers = useMemo(() => {
    if (!selectedHospitalObj) return [];
    return profiles.filter((item) => item.hospital_name === selectedHospitalObj.name);
  }, [profiles, selectedHospitalObj]);

  useEffect(() => {
    const nextDrafts: Record<string, UserRole> = {};
    for (const item of hospitalUsers) nextDrafts[item.id] = item.role;
    setRoleDrafts(nextDrafts);
  }, [hospitalUsers]);

  const profileInitials = getInitials(profileName || profile?.full_name || 'IN');

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida para el avatar.');
      return;
    }
    if (file.size > 400 * 1024) {
      toast.error('La imagen debe pesar menos de 400 KB.');
      return;
    }
    try {
      setAvatarPreview(await readFileAsDataUrl(file));
      setAvatarFileName(file.name);
    } catch (errorValue: unknown) {
      toast.error(errorValue instanceof Error ? errorValue.message : 'No se pudo procesar la imagen.');
    }
  }

  async function handleSaveProfile() {
    if (!profile || !user) {
      toast.error('No se pudo identificar al usuario actual.');
      return;
    }
    if (!profileName.trim()) {
      toast.error('El nombre completo es obligatorio.');
      return;
    }

    setProfileSaving(true);
    try {
      const initials = getInitials(profileName);
      const [profileResponse, metadataResponse] = await Promise.all([
        updateProfile(profile.id, { full_name: profileName.trim(), avatar_initials: initials }),
        updateCurrentUserMetadata({
          full_name: profileName.trim(),
          job_title: jobTitle.trim() || null,
          avatar_data_url: avatarPreview || null,
          avatar_file_name: avatarFileName || null,
        }),
      ]);

      if (profileResponse.error || metadataResponse.error) {
        throw new Error(profileResponse.error?.message ?? metadataResponse.error?.message ?? 'No se pudo guardar el perfil.');
      }

      await refreshProfile();
      toast.success('Perfil actualizado correctamente.');
    } catch (errorValue: unknown) {
      toast.error(errorValue instanceof Error ? errorValue.message : 'No se pudo guardar el perfil.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('La confirmación de contraseña no coincide.');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw new Error(error.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada correctamente.');
    } catch (errorValue: unknown) {
      toast.error(errorValue instanceof Error ? errorValue.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSaveHospital() {
    if (!selectedHospitalObj) {
      toast.error('Primero selecciona un hospital.');
      return;
    }
    if (!hospitalName.trim() || !hospitalCity.trim() || !hospitalDepartment.trim()) {
      toast.error('Nombre, ciudad y departamento son obligatorios.');
      return;
    }
    if (hospitalContactEmail.trim() && !isValidEmail(hospitalContactEmail.trim())) {
      toast.error('Ingresa un correo válido para el hospital.');
      return;
    }
    if (hospitalBeds.trim()) {
      const bedsValue = Number(hospitalBeds);
      if (!Number.isInteger(bedsValue) || bedsValue < 0) {
        toast.error('El número de camas debe ser un entero mayor o igual a cero.');
        return;
      }
    }

    setHospitalSaving(true);
    try {
      const previousHospitalName = selectedHospitalObj.name;
      const { data, error } = await updateHospitalWithReferences(selectedHospitalObj, {
        name: hospitalName.trim(),
        city: hospitalCity.trim(),
        department: hospitalDepartment.trim(),
        beds: hospitalBeds.trim() ? Number(hospitalBeds) : null,
        contact_name: hospitalContactName.trim() || null,
        contact_email: hospitalContactEmail.trim().toLowerCase() || null,
        is_active: hospitalIsActive,
      });
      if (error || !data) throw new Error(error?.message ?? 'No se pudo actualizar el hospital.');
      await refreshHospitals();
      setSelectedHospitalObj(data);
      if (profile?.hospital_name === previousHospitalName) await refreshProfile();
      await loadProfiles();
      toast.success('Hospital actualizado correctamente.');
    } catch (errorValue: unknown) {
      toast.error(errorValue instanceof Error ? errorValue.message : 'No se pudo actualizar el hospital.');
    } finally {
      setHospitalSaving(false);
    }
  }

  async function handleInviteUser() {
    if (!selectedHospitalObj) {
      toast.error('Selecciona un hospital antes de invitar usuarios.');
      return;
    }
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) {
      toast.error('Completa todos los campos para invitar al usuario.');
      return;
    }
    if (!isValidEmail(inviteEmail.trim())) {
      toast.error('Ingresa un correo válido para el nuevo usuario.');
      return;
    }
    if (invitePassword.length < 8) {
      toast.error('La contraseña temporal debe tener al menos 8 caracteres.');
      return;
    }

    setInviteSaving(true);
    try {
      await inviteUser(inviteEmail, invitePassword, inviteName, inviteRole, selectedHospitalObj.name);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('medico');
      setInviteOpen(false);
      await loadProfiles();
      toast.success('Usuario invitado correctamente.');
    } catch (errorValue: unknown) {
      toast.error(errorValue instanceof Error ? errorValue.message : 'No se pudo invitar al usuario.');
    } finally {
      setInviteSaving(false);
    }
  }

  async function handleSaveRole(targetProfile: Profile) {
    if (!isAdmin) return;
    setRoleSavingUserId(targetProfile.id);
    try {
      const { error } = await updateProfile(targetProfile.id, { role: roleDrafts[targetProfile.id] ?? targetProfile.role });
      if (error) throw new Error(error.message);
      await loadProfiles();
      if (targetProfile.id === profile?.id) await refreshProfile();
      toast.success('Rol actualizado correctamente.');
    } catch (errorValue: unknown) {
      toast.error(errorValue instanceof Error ? errorValue.message : 'No se pudo actualizar el rol.');
    } finally {
      setRoleSavingUserId(null);
    }
  }

  async function handleDeactivateUser() {
    if (!deactivateCandidate) return;
    setDeactivateSaving(true);
    try {
      const { error } = await updateProfile(deactivateCandidate.id, { is_active: false });
      if (error) throw new Error(error.message);
      await loadProfiles();
      setDeactivateCandidate(null);
      toast.success('Usuario desactivado correctamente.');
    } catch (errorValue: unknown) {
      toast.error(errorValue instanceof Error ? errorValue.message : 'No se pudo desactivar el usuario.');
    } finally {
      setDeactivateSaving(false);
    }
  }

  async function handleSavePreferences() {
    setPreferencesSaving(true);
    try {
      setTheme(themeDraft);
      toast.success('Preferencias guardadas correctamente.');
    } finally {
      setPreferencesSaving(false);
    }
  }

  function handleResetWelcome() {
    if (!user) {
      toast.error('No se pudo reiniciar la guía de bienvenida.');
      return;
    }
    resetWelcome(user.id);
    toast.success('La guía de bienvenida se mostrará nuevamente.');
  }

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center px-4"><div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /><p className="text-sm text-gray-500 dark:text-gray-400">Cargando configuración...</p></div></div>;

  if (!user || !profile) {
    return (
      <div className="p-4 lg:p-8">
        <EmptyState icon={ShieldAlert} title="No se pudo cargar tu perfil" description="Inicia sesión de nuevo para administrar la configuración de tu cuenta." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Administra tu perfil, el hospital activo y las preferencias de INFECTUS.
        </p>
      </div>

      <SettingsCard title="Mi perfil" description="Actualiza tu información básica y la imagen visible en la navegación.">
        <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center dark:border-gray-700 dark:bg-gray-950/40">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar del usuario" className="h-24 w-24 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-600 text-2xl font-semibold text-white shadow-sm">
                {profileInitials}
              </div>
            )}
            <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">{profileName || 'Sin nombre'}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{avatarFileName || 'Sin foto cargada'}</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={`${secondaryButtonClassName} mt-4 w-full`}>
              <Camera className="h-4 w-4" />
              Subir foto
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre completo">
                <input value={profileName} onChange={(event) => setProfileName(event.target.value)} className={inputClassName} placeholder="Dra. Ana García" />
              </Field>
              <Field label="Cargo o puesto">
                <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className={inputClassName} placeholder="Infectología clínica" />
              </Field>
            </div>

            <Field label="Correo electrónico">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={user.email ?? profile.email} readOnly className={`${readOnlyClassName} pl-10`} />
              </div>
            </Field>

            <div className="flex justify-end">
              <button type="button" onClick={handleSaveProfile} disabled={profileSaving} className={primaryButtonClassName}>
                {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Cambiar contraseña" description="Actualiza el acceso de tu cuenta con una contraseña más segura.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Contraseña actual">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={`${inputClassName} pl-10`} placeholder="Opcional" />
            </div>
          </Field>
          <Field label="Nueva contraseña">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={`${inputClassName} pl-10`} placeholder="Mínimo 8 caracteres" />
            </div>
          </Field>
          <Field label="Confirmar nueva contraseña">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={`${inputClassName} pl-10`} placeholder="Repite la contraseña" />
            </div>
          </Field>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={handleUpdatePassword} disabled={passwordSaving} className={primaryButtonClassName}>
            {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Actualizar contraseña
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Hospital activo" description="Edita la ficha del hospital seleccionado actualmente.">
        {selectedHospitalObj ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre del hospital">
                <input value={hospitalName} onChange={(event) => setHospitalName(event.target.value)} className={inputClassName} placeholder="Hospital General Central" />
              </Field>
              <Field label="Ciudad o municipio">
                <input value={hospitalCity} onChange={(event) => setHospitalCity(event.target.value)} className={inputClassName} placeholder="Bogotá" />
              </Field>
              <Field label="Departamento">
                <input value={hospitalDepartment} onChange={(event) => setHospitalDepartment(event.target.value)} className={inputClassName} placeholder="Cundinamarca" />
              </Field>
              <Field label="Número de camas">
                <input type="number" min="0" value={hospitalBeds} onChange={(event) => setHospitalBeds(event.target.value)} className={inputClassName} placeholder="250" />
              </Field>
              <Field label="Responsable PROA">
                <input value={hospitalContactName} onChange={(event) => setHospitalContactName(event.target.value)} className={inputClassName} placeholder="Dra. Marta López" />
              </Field>
              <Field label="Correo del responsable">
                <input type="email" value={hospitalContactEmail} onChange={(event) => setHospitalContactEmail(event.target.value)} className={inputClassName} placeholder="proa@hospital.com" />
              </Field>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-950/40 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Estado del hospital</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Puedes ocultarlo temporalmente sin perder sus registros.</p>
              </div>
              <button
                type="button"
                onClick={() => setHospitalIsActive((current) => !current)}
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${
                  hospitalIsActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {hospitalIsActive ? 'Activo' : 'Inactivo'}
              </button>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={handleSaveHospital} disabled={hospitalSaving} className={primaryButtonClassName}>
                {hospitalSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="Primero selecciona o crea un hospital para comenzar"
            description="La configuración del hospital activo aparece aquí cuando eliges un hospital desde la navegación."
            action={{ label: 'Ir a hospitales', onClick: () => navigate('/hospitales') }}
          />
        )}
      </SettingsCard>

      <DataManagementPanel
        hospitalId={selectedHospitalObj?.id ?? null}
        hospitalName={selectedHospitalObj?.name ?? null}
      />

      <SettingsCard
        title="Gestión de usuarios"
        description="Invita usuarios del hospital activo y administra sus permisos de acceso."
        badge={(
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
              isAdmin
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            }`}
          >
            {isAdmin ? 'Administrador' : 'Solo Admin'}
          </span>
        )}
      >
        {!selectedHospitalObj ? (
          <EmptyState
            icon={Users}
            title="Selecciona un hospital para ver sus usuarios"
            description="El listado y las invitaciones se habilitan cuando hay un hospital activo."
            action={{ label: 'Ir a hospitales', onClick: () => navigate('/hospitales') }}
          />
        ) : !isAdmin ? (
          <EmptyState
            icon={ShieldAlert}
            title="Solo Admin"
            description="Tu cuenta puede ver esta sección, pero no tiene permisos para invitar ni modificar usuarios."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Usuarios de {selectedHospitalObj.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hospitalUsers.length} usuario{hospitalUsers.length === 1 ? '' : 's'} asociados al hospital activo.
                </p>
              </div>
              <button type="button" onClick={() => setInviteOpen(true)} className={primaryButtonClassName}>
                <Users className="h-4 w-4" />
                Invitar usuario
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 px-4 py-10 dark:border-gray-700">
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  Cargando usuarios...
                </div>
              </div>
            ) : hospitalUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aún no hay usuarios en este hospital"
                description="Invita al primer integrante del equipo PROA para empezar a colaborar."
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="hidden grid-cols-[minmax(0,1.2fr)_180px_140px_160px] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400 md:grid">
                  <span>Usuario</span>
                  <span>Rol</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {hospitalUsers.map((item) => {
                    const initials = item.avatar_initials || getInitials(item.full_name || 'U');
                    const roleValue = roleDrafts[item.id] ?? item.role;
                    const isCurrentUser = item.id === profile.id;

                    return (
                      <div
                        key={item.id}
                        className="grid gap-4 px-4 py-4 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 md:grid-cols-[minmax(0,1.2fr)_180px_140px_160px] md:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.full_name}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                          </div>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400 md:hidden">Rol</p>
                          <select
                            value={roleValue}
                            onChange={(event) => setRoleDrafts((current) => ({ ...current, [item.id]: event.target.value as UserRole }))}
                            className={inputClassName}
                          >
                            {roleOptions.map((option) => (
                              <option key={option} value={option}>
                                {roleLabels[option]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400 md:hidden">Estado</p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.is_active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {item.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleSaveRole(item)} disabled={roleSavingUserId === item.id} className={secondaryButtonClassName}>
                            {roleSavingUserId === item.id && <Loader2 className="h-4 w-4 animate-spin" />}
                            Guardar rol
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (isCurrentUser) {
                                toast.error('No puedes desactivar tu propio usuario.');
                                return;
                              }
                              setDeactivateCandidate(item);
                            }}
                            disabled={!item.is_active}
                            className={dangerButtonClassName}
                          >
                            Desactivar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Preferencias" description="Ajusta el tema visual y reinicia la guía inicial cuando la necesites.">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Tema</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Se sincroniza con tu preferencia guardada y el navegador.</p>
                </div>
                <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-950/40">
                  <button
                    type="button"
                    onClick={() => setThemeDraft('light')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      themeDraft === 'light' ? 'bg-white text-teal-600 shadow-sm dark:bg-gray-900' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeDraft('dark')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      themeDraft === 'dark' ? 'bg-white text-teal-600 shadow-sm dark:bg-gray-900' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    Oscuro
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Idioma</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Español es el idioma activo de toda la plataforma.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Guía de introducción</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Vuelve a mostrar el onboarding de bienvenida en el dashboard.</p>
              </div>
              <button type="button" onClick={handleResetWelcome} className={secondaryButtonClassName}>
                Ver guía de nuevo
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={handleSavePreferences} disabled={preferencesSaving} className={primaryButtonClassName}>
              {preferencesSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar preferencias
            </button>
          </div>
        </div>
      </SettingsCard>

      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!inviteSaving) setInviteOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200 dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invitar usuario</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Crea un acceso nuevo para {selectedHospitalObj?.name ?? 'el hospital activo'}.
                </p>
              </div>
              <button type="button" onClick={() => setInviteOpen(false)} disabled={inviteSaving} className={secondaryButtonClassName}>
                Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Nombre completo">
                <input value={inviteName} onChange={(event) => setInviteName(event.target.value)} className={inputClassName} placeholder="Dr. Juan Pérez" />
              </Field>
              <Field label="Correo electrónico">
                <input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className={inputClassName} placeholder="juan@hospital.com" />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Contraseña temporal">
                  <input type="password" value={invitePassword} onChange={(event) => setInvitePassword(event.target.value)} className={inputClassName} placeholder="Mínimo 8 caracteres" />
                </Field>
                <Field label="Rol">
                  <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as UserRole)} className={inputClassName}>
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {roleLabels[option]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setInviteOpen(false)} disabled={inviteSaving} className={secondaryButtonClassName}>
                Cancelar
              </button>
              <button type="button" onClick={handleInviteUser} disabled={inviteSaving} className={primaryButtonClassName}>
                {inviteSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear usuario
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deactivateCandidate !== null}
        title="Desactivar usuario"
        description={deactivateCandidate ? `¿Deseas desactivar a ${deactivateCandidate.full_name}? El usuario dejará de estar disponible para el hospital activo.` : ''}
        confirmLabel="Desactivar"
        cancelLabel="Cancelar"
        isDangerous
        isLoading={deactivateSaving}
        onConfirm={handleDeactivateUser}
        onCancel={() => {
          if (!deactivateSaving) setDeactivateCandidate(null);
        }}
      />
    </div>
  );
}
