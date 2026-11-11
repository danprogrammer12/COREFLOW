/**
 * CLIENTE SEGURO DE SUPABASE PARA NAVEGADOR (AUTH + POSTGRESQL RLS + STORAGE)
 * CoreFlow — src/lib/supabaseClient.js
 *
 * Reglas de seguridad:
 * 1. Utiliza exclusivamente VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
 * 2. Jamás acepta ni incluye claves secretas de servidor en el código cliente.
 * 3. Gestiona persistencia de sesión real en el navegador (autoRefreshToken + persistSession).
 */

import { createClient } from '@supabase/supabase-js'

const envUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SUPABASE_URL
    : process.env.VITE_SUPABASE_URL

const envAnonKey =
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

let singletonClient = null

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!singletonClient) {
    singletonClient = createClient(envUrl, envAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'coreflow_supabase_auth_token',
      },
    })
  }

  return singletonClient
}
