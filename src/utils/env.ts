interface EnvConfig {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  PRODUCTION_MODE: boolean
}

const DEFAULTS: EnvConfig = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  PRODUCTION_MODE: false,
}

function getEnvVar(key: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)['VITE_' + key]
}

export function getEnvConfig(): EnvConfig {
  const production = !!getEnvVar('PRODUCTION_MODE')
  return {
    SUPABASE_URL: getEnvVar('SUPABASE_URL') || DEFAULTS.SUPABASE_URL,
    SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY') || DEFAULTS.SUPABASE_ANON_KEY,
    PRODUCTION_MODE: production,
  }
}

export function isProductionEnv(): boolean {
  return getEnvConfig().PRODUCTION_MODE
}

export function hasEnvSupabase(): boolean {
  const env = getEnvConfig()
  return !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY)
}
