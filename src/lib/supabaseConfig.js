// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * Configuración pública de Supabase, sin cargar el SDK (la landing no lo necesita).
 */

export const envUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_URL
    : process.env.VITE_SUPABASE_URL

export const envAnonKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : process.env.VITE_SUPABASE_ANON_KEY

export function isSupabaseConfigured() {
  return Boolean(
    envUrl &&
      envAnonKey &&
      String(envUrl).startsWith('http') &&
      !String(envUrl).includes('tu-proyecto.supabase.co') &&
      String(envAnonKey).length > 20 &&
      !String(envAnonKey).includes('tu_anon_public_key_aqui')
  )
}

export function getSupabaseConfigStatus() {
  return {
    configured: isSupabaseConfigured(),
    url: envUrl || null,
    hasAnonKey: Boolean(envAnonKey && !String(envAnonKey).includes('tu_anon_public_key_aqui')),
  }
}
