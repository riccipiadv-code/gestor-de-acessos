// Utilitário de persistência e detecção de recuperação de senha pendente
// Armazena no localStorage (e sessionStorage por redundância de aba)
// Sobrevive a recarregamento de página (F5/reload), abertura em nova aba e reabertura do link

const RECOVERY_STORAGE_KEY = 'ricci_gestor_recovery_pending'

export interface PasswordRecoverySessionData {
  userId?: string
  email?: string
  startedAt: number
}

export const passwordRecoveryStorage = {
  // Salva a flag de recuperação pendente com metadados opcionais
  setPending(data?: { userId?: string; email?: string }): void {
    if (typeof window === 'undefined') return
    const payload: PasswordRecoverySessionData = {
      userId: data?.userId,
      email: data?.email,
      startedAt: Date.now(),
    }
    const serialized = JSON.stringify(payload)
    try {
      localStorage.setItem(RECOVERY_STORAGE_KEY, serialized)
    } catch {
      // Ignora erro de cota ou storage restrito
    }
    try {
      sessionStorage.setItem(RECOVERY_STORAGE_KEY, serialized)
    } catch {
      // Ignora erro de cota ou storage restrito
    }
  },

  // Verifica se há uma recuperação de senha pendente ativa no storage
  isPending(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const fromLocal = localStorage.getItem(RECOVERY_STORAGE_KEY)
      if (fromLocal) return true
      const fromSession = sessionStorage.getItem(RECOVERY_STORAGE_KEY)
      if (fromSession) return true
    } catch {
      return false
    }
    return false
  },

  // Lê os dados salvos durante a recuperação pendente
  getData(): PasswordRecoverySessionData | null {
    if (typeof window === 'undefined') return null
    try {
      const raw =
        localStorage.getItem(RECOVERY_STORAGE_KEY) || sessionStorage.getItem(RECOVERY_STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as PasswordRecoverySessionData
    } catch {
      return null
    }
  },

  // Limpa o estado pendente - DEVE SER CHAMADO SOMENTE após:
  // 1. Atualização bem-sucedida da senha
  // 2. Logout ou cancelamento explícito
  clear(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(RECOVERY_STORAGE_KEY)
    } catch {
      // Ignora
    }
    try {
      sessionStorage.removeItem(RECOVERY_STORAGE_KEY)
    } catch {
      // Ignora
    }
  },

  // Verifica se a URL atual contém tokens/parâmetros de recuperação do Supabase Auth
  hasRecoveryUrlParams(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const hash = window.location.hash || ''
      const search = window.location.search || ''

      // Supabase Auth pode enviar no hash ou search:
      // Hash: #access_token=...&type=recovery... ou #type=recovery
      // Search: ?type=recovery ou ?token_hash=...&type=recovery
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        return true
      }

      if (hash.includes('access_token=') && hash.includes('recovery')) {
        return true
      }

      // Supabase PKCE code exchange or token_hash with recovery
      const searchParams = new URLSearchParams(search)
      if (searchParams.get('type') === 'recovery') {
        return true
      }
    } catch {
      return false
    }
    return false
  },

  // Retorna se a URL atual contém erros explícitos de auth na query ou hash
  // (ex: #error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired)
  getRecoveryErrorFromUrl(): string | null {
    if (typeof window === 'undefined') return null
    try {
      const hash = window.location.hash || ''
      const search = window.location.search || ''

      const parseError = (queryString: string) => {
        const clean = queryString.replace(/^[#?]/, '')
        if (!clean) return null
        const params = new URLSearchParams(clean)
        const errDesc = params.get('error_description')
        const errCode = params.get('error_code')
        const err = params.get('error')
        if (errDesc) return decodeURIComponent(errDesc.replace(/\+/g, ' '))
        if (errCode || err) return errCode || err
        return null
      }

      return parseError(hash) || parseError(search)
    } catch {
      return null
    }
  },
}
