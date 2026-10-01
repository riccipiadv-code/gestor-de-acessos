// Utilitário de persistência e detecção de primeiro acesso (convite de novo usuário)
// Armazena no localStorage (e sessionStorage por redundância de aba)
// Sobrevive a recarregamento de página (F5/reload), abertura em nova aba e reabertura do link
// Análogo a src/lib/data/passwordRecoveryStorage.ts mas com isolamento estrito para CONVITE

const INVITE_STORAGE_KEY = 'ricci_gestor_invite_pending'

export interface InviteSessionData {
  userId?: string
  email?: string
  startedAt: number
  verified: boolean
}

export const inviteSessionStorage = {
  // Salva a flag de convite pendente com metadados opcionais e confirmação de validação
  setPending(data?: { userId?: string; email?: string; verified?: boolean }): void {
    if (typeof window === 'undefined') return
    const payload: InviteSessionData = {
      userId: data?.userId,
      email: data?.email,
      startedAt: Date.now(),
      verified: Boolean(data?.verified),
    }
    const serialized = JSON.stringify(payload)
    try {
      localStorage.setItem(INVITE_STORAGE_KEY, serialized)
    } catch {
      // Ignora erro de cota ou storage restrito
    }
    try {
      sessionStorage.setItem(INVITE_STORAGE_KEY, serialized)
    } catch {
      // Ignora erro de cota ou storage restrito
    }
  },

  // Marca que o convite foi validado com sucesso (após verifyOtp ou detecção de hash válida)
  // Requer userId para garantir que a sessão comprovada está vinculada a um usuário
  setVerified(userId?: string, email?: string): void {
    if (typeof window === 'undefined') return
    const current = this.getData()
    const finalUserId = userId || current?.userId
    const finalEmail = email || current?.email
    const payload: InviteSessionData = {
      userId: finalUserId,
      email: finalEmail,
      startedAt: current?.startedAt || Date.now(),
      verified: Boolean(finalUserId),
    }
    const serialized = JSON.stringify(payload)
    try {
      localStorage.setItem(INVITE_STORAGE_KEY, serialized)
    } catch {
      // Ignora
    }
    try {
      sessionStorage.setItem(INVITE_STORAGE_KEY, serialized)
    } catch {
      // Ignora
    }
  },

  // Verifica se há um primeiro acesso (convite) pendente ativo no storage
  isPending(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const fromLocal = localStorage.getItem(INVITE_STORAGE_KEY)
      if (fromLocal) return true
      const fromSession = sessionStorage.getItem(INVITE_STORAGE_KEY)
      if (fromSession) return true
    } catch {
      return false
    }
    return false
  },

  // Verifica se o convite já foi comprovadamente validado no storage
  isVerified(): boolean {
    const data = this.getData()
    return Boolean(data?.verified)
  },

  // Lê os dados salvos durante o primeiro acesso pendente
  getData(): InviteSessionData | null {
    if (typeof window === 'undefined') return null
    try {
      const raw =
        localStorage.getItem(INVITE_STORAGE_KEY) || sessionStorage.getItem(INVITE_STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as InviteSessionData
    } catch {
      return null
    }
  },

  // Limpa o estado pendente - DEVE SER CHAMADO SOMENTE após:
  // 1. Atualização bem-sucedida da primeira senha e encerramento seguro da sessão
  // 2. Logout ou cancelamento explícito
  clear(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(INVITE_STORAGE_KEY)
    } catch {
      // Ignora
    }
    try {
      sessionStorage.removeItem(INVITE_STORAGE_KEY)
    } catch {
      // Ignora
    }
  },

  // Verifica se a URL atual contém tokens/parâmetros de convite (type=invite) do Supabase Auth
  hasInviteUrlParams(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const hash = window.location.hash || ''
      const search = window.location.search || ''

      // Supabase Auth pode enviar:
      // Hash: #access_token=...&type=invite... ou #type=invite
      // Search: ?type=invite ou ?token_hash=...&type=invite ou code PKCE
      if (hash.includes('type=invite') || search.includes('type=invite')) {
        return true
      }

      if (hash.includes('access_token=') && hash.includes('invite')) {
        return true
      }

      const searchParams = new URLSearchParams(search)
      if (searchParams.get('type') === 'invite') {
        return true
      }
    } catch {
      return false
    }
    return false
  },

  // Retorna os parâmetros de OTP se presentes na URL (?token_hash=...&type=invite ou ?code=...)
  getInviteOtpParams(): { token_hash?: string; code?: string; type?: string } | null {
    if (typeof window === 'undefined') return null
    try {
      const search = window.location.search || ''
      const hash = window.location.hash || ''

      const searchParams = new URLSearchParams(search)
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const code = searchParams.get('code')

      if (tokenHash && type === 'invite') {
        return { token_hash: tokenHash, type: 'invite' }
      }

      if (code) {
        return { code }
      }

      // Hash fragment tokens
      const hashClean = hash.replace(/^[#?]/, '')
      if (hashClean) {
        const hashParams = new URLSearchParams(hashClean)
        const hashType = hashParams.get('type')
        const hashToken = hashParams.get('token_hash')
        if (hashToken && hashType === 'invite') {
          return { token_hash: hashToken, type: 'invite' }
        }
      }
    } catch {
      return null
    }
    return null
  },

  // Retorna se a URL atual contém erros explícitos de auth na query ou hash
  // (ex: #error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired)
  getInviteErrorFromUrl(): string | null {
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
