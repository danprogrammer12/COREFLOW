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

import { envUrl, envAnonKey, isSupabaseConfigured, getSupabaseConfigStatus } from './supabaseConfig.js'

export { isSupabaseConfigured, getSupabaseConfigStatus }

let singletonClient = null
let rememberSession = true

/**
 * Con «Mantener sesión activa» la sesión sobrevive al cierre del navegador
 * (localStorage). Sin ella, dura hasta cerrar el navegador (sessionStorage).
 */
export function setSessionPersistence(remember) {
  rememberSession = remember !== false
}

function pick(store) {
  try {
    return typeof window === 'undefined' ? null : window[store]
  } catch {
    return null
  }
}

const sessionAwareStorage = {
  getItem: (key) => pick('localStorage')?.getItem(key) ?? pick('sessionStorage')?.getItem(key) ?? null,
  setItem: (key, value) => {
    const [target, other] = rememberSession ? ['localStorage', 'sessionStorage'] : ['sessionStorage', 'localStorage']
    pick(target)?.setItem(key, value)
    pick(other)?.removeItem(key)
  },
  removeItem: (key) => {
    pick('localStorage')?.removeItem(key)
    pick('sessionStorage')?.removeItem(key)
  },
}

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
        storage: sessionAwareStorage,
      },
    })
  }

  return singletonClient
}
