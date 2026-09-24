import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { passwordRecoveryStorage } from './passwordRecoveryStorage'

export interface AuthContextUser {
  id: string
  auth_user_id: string
  nome: string
  email: string
  ativo: boolean
  is_admin: boolean
}

interface AuthContextValue {
  user: AuthContextUser | null
  session: Session | null
  authUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  authError: string | null
  isPasswordRecovery: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  solicitarRecuperacaoSenha: (email: string) => Promise<{ success: boolean; message: string }>
  atualizarSenhaRecuperacao: (novaSenha: string) => Promise<{ success: boolean; error?: string }>
  cancelarRecuperacaoSenha: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthContextUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    // Inicializa a partir de:
    // 1. Estado persistido em storage (sobrevive a reload, nova aba, reabertura do link)
    // 2. Fragmentos/parâmetros de recovery na URL
    const pendingInStorage = passwordRecoveryStorage.isPending()
    const hasUrlParams = passwordRecoveryStorage.hasRecoveryUrlParams()
    return pendingInStorage || hasUrlParams
  })

  // Ref para sincronizar o estado síncrono nos callbacks sem depender de closures antigas
  const isPasswordRecoveryRef = useRef<boolean>(isPasswordRecovery)
  useEffect(() => {
    isPasswordRecoveryRef.current = isPasswordRecovery
  }, [isPasswordRecovery])

  // Validação OBRIGATÓRIA da cadeia de autorização:
  // auth.users → core_usuarios pelo auth_user_id → usuário ativo → RPC core_is_gestor_acesso_admin() = true
  const validateAccessChain = useCallback(
    async (
      currentAuthUser: User,
    ): Promise<{
      valid: boolean
      contextUser?: AuthContextUser
      error?: string
    }> => {
      try {
        // 1. core_usuarios pelo auth_user_id
        const { data: coreUser, error: coreUserErr } = await supabase
          .from('core_usuarios')
          .select('id, auth_user_id, nome, email, ativo')
          .eq('auth_user_id', currentAuthUser.id)
          .maybeSingle()

        if (coreUserErr) {
          return {
            valid: false,
            error: 'Falha ao consultar cadastro corporativo: ' + coreUserErr.message,
          }
        }

        if (!coreUser) {
          return {
            valid: false,
            error:
              'Acesso negado: sua conta de autenticação não está vinculada a um usuário corporativo em core_usuarios.',
          }
        }

        // 2. usuário corporativo ativo
        if (!coreUser.ativo) {
          return {
            valid: false,
            error: 'Acesso bloqueado: seu usuário corporativo está inativo no sistema.',
          }
        }

        // 3. RPC core_is_gestor_acesso_admin() = true
        const { data: isAdmin, error: rpcErr } = await supabase.rpc('core_is_gestor_acesso_admin')

        if (rpcErr) {
          return {
            valid: false,
            error: 'Falha ao validar autorização administrativa: ' + rpcErr.message,
          }
        }

        if (!isAdmin) {
          return {
            valid: false,
            error:
              'Acesso restrito: seu usuário corporativo não possui perfil de Administrador no Gestor de Acesso.',
          }
        }

        return {
          valid: true,
          contextUser: {
            id: coreUser.id,
            auth_user_id: currentAuthUser.id,
            nome: coreUser.nome,
            email: coreUser.email,
            ativo: coreUser.ativo,
            is_admin: true,
          },
        }
      } catch (err: unknown) {
        const error = err as Error
        return {
          valid: false,
          error: error?.message || 'Erro inesperado ao validar credenciais.',
        }
      }
    },
    [],
  )

  // Inicialização e escuta da sessão Supabase Auth
  useEffect(() => {
    let isMounted = true

    // Observador do Supabase Auth (sem async no callback conforme regra do template)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setAuthUser(newSession?.user ?? null)

      // Evento explícito: PASSWORD_RECOVERY disparado pelo Supabase na 1ª abertura
      if (event === 'PASSWORD_RECOVERY') {
        passwordRecoveryStorage.setPending({
          userId: newSession?.user?.id,
          email: newSession?.user?.email,
        })
        isPasswordRecoveryRef.current = true
        setIsPasswordRecovery(true)
        setUser(null) // NUNCA autoriza acesso corporativo
        setAuthError(null)
        setIsLoading(false)
        return
      }

      // Se for SIGNED_OUT, limpa tudo e desliga recovery
      if (event === 'SIGNED_OUT' || !newSession?.user) {
        passwordRecoveryStorage.clear()
        isPasswordRecoveryRef.current = false
        setUser(null)
        setIsPasswordRecovery(false)
        setIsLoading(false)
        return
      }

      // Detecção de recuperação ativa por storage persistido, URL ou flag em memória
      const pendingInStorage = passwordRecoveryStorage.isPending()
      const hasUrlParams = passwordRecoveryStorage.hasRecoveryUrlParams()
      const isRecoveryActive = isPasswordRecoveryRef.current || pendingInStorage || hasUrlParams

      if (isRecoveryActive) {
        // Assegura que o storage persista a recuperação desta sessão
        passwordRecoveryStorage.setPending({
          userId: newSession.user.id,
          email: newSession.user.email,
        })
        isPasswordRecoveryRef.current = true
        setIsPasswordRecovery(true)
        setUser(null) // Sessão de recovery NUNCA é tratada como login normal
        setIsLoading(false)
        return
      }

      // Sessão normal: validar cadeia de autorização corporativa
      validateAccessChain(newSession.user).then((check) => {
        if (!isMounted) return
        // Dupla checagem: se virou recovery durante a validação assíncrona, ignora login
        if (isPasswordRecoveryRef.current || passwordRecoveryStorage.isPending()) {
          setUser(null)
          setIsLoading(false)
          return
        }

        if (check.valid && check.contextUser) {
          setUser(check.contextUser)
          setAuthError(null)
        } else {
          supabase.auth.signOut().then(() => {
            if (!isMounted) return
            setUser(null)
            setSession(null)
            setAuthError(check.error || 'Acesso não autorizado ao Gestor de Acesso.')
          })
        }
        setIsLoading(false)
      })
    })

    // Sincronização inicial da sessão (ex: reload da página ou abertura do link)
    const initializeAuth = async () => {
      try {
        const hasUrlParams = passwordRecoveryStorage.hasRecoveryUrlParams()
        const pendingInStorage = passwordRecoveryStorage.isPending()
        const isRecoveryExpected = hasUrlParams || pendingInStorage

        if (isRecoveryExpected) {
          isPasswordRecoveryRef.current = true
          setIsPasswordRecovery(true)
        }

        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (!initialSession?.user) {
          // Se não há sessão, mas havia flag no storage, remove flag pois a sessão já expirou
          if (!hasUrlParams) {
            passwordRecoveryStorage.clear()
            isPasswordRecoveryRef.current = false
            setIsPasswordRecovery(false)
          }
          setSession(null)
          setAuthUser(null)
          setUser(null)
          setIsLoading(false)
          return
        }

        setSession(initialSession)
        setAuthUser(initialSession.user)

        // Se for recuperação (por storage, URL ou ref), persiste e NUNCA valida cadeia corporativa
        if (isRecoveryExpected || isPasswordRecoveryRef.current) {
          passwordRecoveryStorage.setPending({
            userId: initialSession.user.id,
            email: initialSession.user.email,
          })
          isPasswordRecoveryRef.current = true
          setIsPasswordRecovery(true)
          setUser(null)
          setIsLoading(false)
          return
        }

        const check = await validateAccessChain(initialSession.user)
        if (!isMounted) return

        if (isPasswordRecoveryRef.current || passwordRecoveryStorage.isPending()) {
          setUser(null)
          setIsLoading(false)
          return
        }

        if (check.valid && check.contextUser) {
          setUser(check.contextUser)
          setAuthError(null)
        } else {
          // Cadeia falhou para login normal: encerra a sessão imediatamente
          await supabase.auth.signOut()
          setSession(null)
          setAuthUser(null)
          setUser(null)
          setAuthError(check.error || 'Acesso não autorizado ao Gestor de Acesso.')
        }
      } catch (err) {
        console.error('Erro na inicialização de autenticação:', err)
        if (isMounted) {
          setUser(null)
          setSession(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [validateAccessChain])

  const login = async (email: string, password: string) => {
    setAuthError(null)
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      const err = 'E-mail corporativo e senha são obrigatórios.'
      setAuthError(err)
      return { success: false, error: err }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) {
        let msg = error.message
        if (msg.includes('Invalid login credentials')) {
          msg = 'Credenciais incorretas. Verifique seu e-mail corporativo e senha.'
        }
        setAuthError(msg)
        return { success: false, error: msg }
      }

      if (!data.user) {
        const err = 'Nenhum usuário retornado pelo serviço de autenticação.'
        setAuthError(err)
        return { success: false, error: err }
      }

      // Validação estrita da cadeia de autorização
      const check = await validateAccessChain(data.user)
      if (!check.valid || !check.contextUser) {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
        const errMsg = check.error || 'Acesso negado ao Gestor de Acesso.'
        setAuthError(errMsg)
        return { success: false, error: errMsg }
      }

      setUser(check.contextUser)
      setAuthError(null)
      return { success: true }
    } catch (err: unknown) {
      const error = err as Error
      const msg = error?.message || 'Falha ao autenticar no servidor.'
      setAuthError(msg)
      return { success: false, error: msg }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      passwordRecoveryStorage.clear()
      isPasswordRecoveryRef.current = false
      setUser(null)
      setSession(null)
      setAuthUser(null)
      setAuthError(null)
      setIsPasswordRecovery(false)
    }
  }

  // Atualiza a senha do usuário com a sessão atual de recovery
  const atualizarSenhaRecuperacao = async (
    novaSenha: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: novaSenha,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Falha ao redefinir senha no Supabase Auth.' }
      }

      // Encerra a sessão temporária de recuperação por segurança e limpa o estado
      try {
        await supabase.auth.signOut()
      } catch {
        // Ignora eventual falha de rede no signOut
      }
      passwordRecoveryStorage.clear()
      isPasswordRecoveryRef.current = false
      setIsPasswordRecovery(false)
      setUser(null)
      setSession(null)
      setAuthUser(null)

      return { success: true }
    } catch (err: unknown) {
      const e = err as Error
      return { success: false, error: e?.message || 'Erro inesperado ao atualizar senha.' }
    }
  }

  const cancelarRecuperacaoSenha = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      passwordRecoveryStorage.clear()
      isPasswordRecoveryRef.current = false
      setIsPasswordRecovery(false)
      setUser(null)
      setSession(null)
      setAuthUser(null)
    }
  }

  const solicitarRecuperacaoSenha = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      return { success: false, message: 'E-mail corporativo é obrigatório.' }
    }

    try {
      const redirectUrl = `${window.location.origin}/`
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return {
        success: true,
        message: `Se o endereço ${cleanEmail} possuir conta no Supabase Auth, você receberá um e-mail com instruções seguras para redefinição.`,
      }
    } catch (err: unknown) {
      const error = err as Error
      return {
        success: false,
        message: error?.message || 'Não foi possível solicitar a recuperação.',
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        authUser,
        isAuthenticated: Boolean(!isPasswordRecovery && user && user.is_admin),
        isLoading,
        authError,
        isPasswordRecovery,
        login,
        logout,
        solicitarRecuperacaoSenha,
        atualizarSenhaRecuperacao,
        cancelarRecuperacaoSenha,
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
