import React, { createContext, useContext, useState, useEffect } from 'react'

export interface AuthUser {
  id: string
  email: string
  nome: string
  cargo?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, senha?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  solicitarRecuperacaoSenha: (email: string) => Promise<{ success: boolean; message: string }>
}

const AUTH_STORAGE_KEY = 'gestor_ricci_auth_session'

const DEFAULT_MOCK_USER: AuthUser = {
  id: 'usr-1',
  email: 'antonio.ricci@riccipi.com.br',
  nome: 'Antônio Ricci',
  cargo: 'Administrador Geral',
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Carrega sessão salva no localStorage (mock temporário que simula persistência do Supabase Auth)
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      } else {
        // Sessão padrão inicial do usuário administrador para conveniência
        setUser(DEFAULT_MOCK_USER)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_USER))
      }
    } catch {
      setUser(DEFAULT_MOCK_USER)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, _senha?: string) => {
    // NOTA DE SEGURANÇA E ARQUITETURA:
    // Esta etapa NÃO inventa autenticação paralela com armazenamento de senhas.
    // Futuramente esta função chamará:
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    // Nenhuma senha é validada localmente, nem armazenada no localStorage ou em estado.
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      return { success: false, error: 'Informe um e-mail corporativo válido' }
    }

    const sessionUser: AuthUser = {
      id: cleanEmail === DEFAULT_MOCK_USER.email ? DEFAULT_MOCK_USER.id : `usr-${Date.now()}`,
      email: cleanEmail,
      nome:
        cleanEmail === DEFAULT_MOCK_USER.email
          ? DEFAULT_MOCK_USER.nome
          : cleanEmail.split('@')[0].replace('.', ' '),
      cargo: 'Administrador Gestor',
    }

    setUser(sessionUser)
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser))
    } catch {
      // ignore
    }

    return { success: true }
  }

  const logout = () => {
    // Futuramente: await supabase.auth.signOut()
    setUser(null)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const solicitarRecuperacaoSenha = async (email: string) => {
    // NOTA DE SEGURANÇA E ARQUITETURA:
    // Futuramente esta operação chamará:
    // await supabase.auth.resetPasswordForEmail(email, { redirectTo: '...' })
    // Nesta etapa apenas simulamos a resposta de interface sem tocar em backend.
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      return { success: false, message: 'E-mail corporativo é obrigatório.' }
    }

    return {
      success: true,
      message: `Se o e-mail ${cleanEmail} estiver cadastrado no Supabase Auth, você receberá um link seguro para definir uma nova senha.`,
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        solicitarRecuperacaoSenha,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
