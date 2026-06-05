interface EnvConfig {
  ADMIN_USERNAME: string
  ADMIN_PASSWORD: string
  PR_VERIFY_CODE: string
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_BRANCH: string
  GITHUB_TOKEN?: string
  PRODUCTION_MODE: boolean
}

const DEFAULTS: EnvConfig = {
  ADMIN_USERNAME: '',
  ADMIN_PASSWORD: '',
  PR_VERIFY_CODE: '',
  GITHUB_OWNER: 'VoidX3D',
  GITHUB_REPO: 'RU_Club_Website',
  GITHUB_BRANCH: 'main',
  PRODUCTION_MODE: false,
}

function getEnvVar(key: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)['VITE_' + key]
}

export function getEnvConfig(): EnvConfig {
  const production = !!getEnvVar('PRODUCTION_MODE')
  return {
    ADMIN_USERNAME: getEnvVar('ADMIN_USERNAME') || DEFAULTS.ADMIN_USERNAME,
    ADMIN_PASSWORD: getEnvVar('ADMIN_PASSWORD') || DEFAULTS.ADMIN_PASSWORD,
    PR_VERIFY_CODE: getEnvVar('PR_VERIFY_CODE') || DEFAULTS.PR_VERIFY_CODE,
    GITHUB_OWNER: getEnvVar('GITHUB_OWNER') || DEFAULTS.GITHUB_OWNER,
    GITHUB_REPO: getEnvVar('GITHUB_REPO') || DEFAULTS.GITHUB_REPO,
    GITHUB_BRANCH: getEnvVar('GITHUB_BRANCH') || DEFAULTS.GITHUB_BRANCH,
    GITHUB_TOKEN: getEnvVar('GITHUB_TOKEN'),
    PRODUCTION_MODE: production,
  }
}

export function isProductionEnv(): boolean {
  return getEnvConfig().PRODUCTION_MODE
}

export function hasEnvAuth(): boolean {
  const env = getEnvConfig()
  return !!(env.ADMIN_USERNAME && env.ADMIN_PASSWORD)
}
