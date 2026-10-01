import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { passwordRecoveryStorage } from './passwordRecoveryStorage'
import { inviteSessionStorage } from './inviteSessionStorage'

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
  isFirstAccess: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  solicitarRecuperacaoSenha: (email: string) => Promise<{ success: boolean; message: string }>
  atualizarSenhaRecuperacao: (novaSenha: string) => Promise<{ success: boolean; error?: string }>
  cancelarRecuperacaoSenha: () => Promise<void>
  concluirPrimeiroAcesso: (novaSenha: string) => Promise<{ success: boolean; error?: string }>
  cancelarPrimeiroAcesso: () => Promise<void>
  marcarPrimeiroAcessoAtivo: (userId?: string, email?: string) => void
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

  const [isFirstAccess, setIsFirstAccess] = useState<boolean>(() => {
    // Inicializa a partir de:
    // 1. Estado persistido em storage (sobrevive a reload, nova aba, reabertura do link)
    // 2. Fragmentos/parâmetros de invite na URL
    // 3. Caminho atual ser /primeiro-acesso
    const pendingInStorage = inviteSessionStorage.isPending()
    const hasUrlParams = inviteSessionStorage.hasInviteUrlParams()
    const isAtPrimeiroAcessoPath =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/primeiro-acesso')
    return pendingInStorage || hasUrlParams || isAtPrimeiroAcessoPath
  })

  // Ref para sincronizar o estado síncrono nos callbacks sem depender de closures antigas
  const isPasswordRecoveryRef = useRef<boolean>(isPasswordRecovery)
  useEffect(() => {
    isPasswordRecoveryRef.current = isPasswordRecovery
  }, [isPasswordRecovery])

  const isFirstAccessRef = useRef<boolean>(isFirstAccess)
  useEffect(() => {
    isFirstAccessRef.current = isFirstAccess
  }, [isFirstAccess])

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

      // Se for SIGNED_OUT, limpa tudo e desliga recovery / invite
      if (event === 'SIGNED_OUT' || !newSession?.user) {
        passwordRecoveryStorage.clear()
        inviteSessionStorage.clear()
        isPasswordRecoveryRef.current = false
        isFirstAccessRef.current = false
        setUser(null)
        setIsPasswordRecovery(false)
        setIsFirstAccess(false)
        setIsLoading(false)
        return
      }

      // 1. Detecção de PRIMEIRO ACESSO (CONVITE) ativo por storage, URL ou flag em memória
      const isAtPrimeiroAcessoPath =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/primeiro-acesso')
      const pendingInviteInStorage = inviteSessionStorage.isPending()
      const hasInviteUrlParams = inviteSessionStorage.hasInviteUrlParams()
      const isInviteActive =
        isFirstAccessRef.current ||
        pendingInviteInStorage ||
        hasInviteUrlParams ||
        isAtPrimeiroAcessoPath

      if (isInviteActive) {
        // Persistir estado de primeiro acesso isolado
        inviteSessionStorage.setPending({
          userId: newSession.user.id,
          email: newSession.user.email,
          verified: inviteSessionStorage.isVerified(),
        })
        isFirstAccessRef.current = true
        setIsFirstAccess(true)
        setUser(null) // NUNCA autoriza acesso administrativo corporativo
        setAuthError(null)
        setIsLoading(false)
        return
      }
      // 2. Detecção de recuperação ativa por storage persistido, URL ou flag em memória
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
      // Guarda estrita: se for ou se tornar primeiro acesso / recovery durante a chamada, bloqueia
      validateAccessChain(newSession.user).then((check) => {
        if (!isMounted) return
        if (
          isFirstAccessRef.current ||
          inviteSessionStorage.isPending() ||
          inviteSessionStorage.hasInviteUrlParams() ||
          (typeof window !== 'undefined' && window.location.pathname.startsWith('/primeiro-acesso'))
        ) {
          setUser(null)
          setIsLoading(false)
          return
        }
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
        const isAtPrimeiroAcessoPath =
          typeof window !== 'undefined' && window.location.pathname.startsWith('/primeiro-acesso')
        const hasInviteUrlParams = inviteSessionStorage.hasInviteUrlParams()
        const pendingInviteInStorage = inviteSessionStorage.isPending()
        const isInviteExpected =
          hasInviteUrlParams || pendingInviteInStorage || isAtPrimeiroAcessoPath

        if (isInviteExpected) {
          isFirstAccessRef.current = true
          setIsFirstAccess(true)
        }

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
          // Se não há sessão, mas havia flag no storage, remove flag se a URL não trouxer tokens novos
          if (!hasInviteUrlParams && !isAtPrimeiroAcessoPath) {
            inviteSessionStorage.clear()
            isFirstAccessRef.current = false
            setIsFirstAccess(false)
          }
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

        // Se for PRIMEIRO ACESSO (por storage, URL ou rota), persiste e NUNCA valida cadeia corporativa
        if (isInviteExpected || isFirstAccessRef.current) {
          inviteSessionStorage.setPending({
            userId: initialSession.user.id,
            email: initialSession.user.email,
            verified: inviteSessionStorage.isVerified(),
          })
          isFirstAccessRef.current = true
          setIsFirstAccess(true)
          setUser(null)
          setIsLoading(false)
          return
        }
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

        if (
          isFirstAccessRef.current ||
          inviteSessionStorage.isPending() ||
          inviteSessionStorage.hasInviteUrlParams() ||
          (typeof window !== 'undefined' && window.location.pathname.startsWith('/primeiro-acesso'))
        ) {
          setUser(null)
          setIsLoading(false)
          return
        }

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
          await supabase.auth.signOut({ scope: 'local' })
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
      inviteSessionStorage.clear()
      isPasswordRecoveryRef.current = false
      isFirstAccessRef.current = false
      setUser(null)
      setSession(null)
      setAuthUser(null)
      setAuthError(null)
      setIsPasswordRecovery(false)
      setIsFirstAccess(false)
    }
  }

  // Conclui o primeiro acesso: cadastra a senha na sessão temporária, faz signOut local rigoroso
  const concluirPrimeiroAcesso = async (
    novaSenha: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Só permitir se houver primeiro acesso comprovadamente ativo
      if (!isFirstAccessRef.current && !inviteSessionStorage.isPending()) {
        await supabase.auth.signOut({ scope: 'local' })
        inviteSessionStorage.clear()
        isFirstAccessRef.current = false
        setIsFirstAccess(false)
        setUser(null)
        setSession(null)
        setAuthUser(null)
        return {
          success: false,
          error: 'Acesso não autorizado: a definição da primeira senha requer um convite válido.',
        }
      }

      // Validação da sessão ativa do Supabase
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!currentSession?.user) {
        await supabase.auth.signOut({ scope: 'local' })
        inviteSessionStorage.clear()
        isFirstAccessRef.current = false
        setIsFirstAccess(false)
        setUser(null)
        setSession(null)
        setAuthUser(null)
        return {
          success: false,
          error:
            'Sessão de convite expirada ou inválida. Solicite um novo convite ao administrador.',
        }
      }

      // 2. Chamar supabase.auth.updateUser({ password }) na sessão temporária do convidado
      const { data, error } = await supabase.auth.updateUser({
        password: novaSenha,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Falha ao cadastrar senha no Supabase Auth.' }
      }

      // 3. Encerrar a sessão temporária com signOut({ scope: 'local' }) e VERIFICAR o resultado
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      if (signOutError) {
        console.error('Erro ao encerrar sessão temporária:', signOutError)
        return {
          success: false,
          error:
            'A senha foi atualizada, mas não foi possível encerrar a sessão temporária com segurança. Não navegue na área interna e tente recarregar a página.',
        }
      }

      // 4. Limpar o estado específico do primeiro acesso
      inviteSessionStorage.clear()
      isFirstAccessRef.current = false
      setIsFirstAccess(false)
      setUser(null)
      setSession(null)
      setAuthUser(null)

      // 5. Confirmar que não resta sessão local antes de informar sucesso
      const {
        data: { session: postSignOutSession },
      } = await supabase.auth.getSession()

      if (postSignOutSession) {
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch {
          // ignore
        }
        return {
          success: false,
          error:
            'A sessão temporária ainda permanece ativa no navegador. Por segurança, feche esta aba antes de acessar os sistemas Ricci.',
        }
      }

      return { success: true }
    } catch (err: unknown) {
      const e = err as Error
      return { success: false, error: e?.message || 'Erro inesperado ao definir senha.' }
    }
  }

  const cancelarPrimeiroAcesso = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } finally {
      inviteSessionStorage.clear()
      isFirstAccessRef.current = false
      setIsFirstAccess(false)
      setUser(null)
      setSession(null)
      setAuthUser(null)
    }
  }

  const marcarPrimeiroAcessoAtivo = (userId?: string, email?: string) => {
    inviteSessionStorage.setVerified(userId, email)
    isFirstAccessRef.current = true
    setIsFirstAccess(true)
    setUser(null)
  }

  // Atualiza a senha do usuário com a sessão atual de recovery
  const atualizarSenhaRecuperacao = async (
    novaSenha: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Só permitir se houver sessão ativa explicitamente originada de recovery
      if (!isPasswordRecoveryRef.current && !passwordRecoveryStorage.isPending()) {
        await supabase.auth.signOut({ scope: 'local' })
        passwordRecoveryStorage.clear()
        isPasswordRecoveryRef.current = false
        setIsPasswordRecovery(false)
        setUser(null)
        setSession(null)
        setAuthUser(null)
        return {
          success: false,
          error:
            'Acesso não autorizado: a redefinição de senha requer um link de recuperação válido.',
        }
      }

      // Validação da sessão ativa do Supabase
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!currentSession?.user) {
        await supabase.auth.signOut({ scope: 'local' })
        passwordRecoveryStorage.clear()
        isPasswordRecoveryRef.current = false
        setIsPasswordRecovery(false)
        setUser(null)
        setSession(null)
        setAuthUser(null)
        return {
          success: false,
          error: 'Sessão de recuperação expirada ou inválida. Solicite um novo link.',
        }
      }

      // 2. Chamar updateUser({ password })
      const { data, error } = await supabase.auth.updateUser({
        password: novaSenha,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Falha ao redefinir senha no Supabase Auth.' }
      }

      // 3. Encerrar a sessão de recovery local com signOut({ scope: 'local' })
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (signOutErr) {
        console.warn('Aviso no signOut local após redefinição:', signOutErr)
      }

      // 4. Limpar o estado persistido de recovery
      passwordRecoveryStorage.clear()
      isPasswordRecoveryRef.current = false
      setIsPasswordRecovery(false)
      setUser(null)
      setSession(null)
      setAuthUser(null)

      // 5. Confirmar que não resta sessão local antes de confirmar sucesso
      const {
        data: { session: postSignOutSession },
      } = await supabase.auth.getSession()

      if (postSignOutSession) {
        // Tenta mais um signOut forçado
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch {
          // ignore
        }
        // Se ainda restar sessão, não tratar como login
        return {
          success: false,
          error:
            'Não foi possível encerrar a sessão de recuperação local com segurança. Por favor, feche o navegador.',
        }
      }

      return { success: true }
    } catch (err: unknown) {
      const e = err as Error
      return { success: false, error: e?.message || 'Erro inesperado ao atualizar senha.' }
    }
  }

  const cancelarRecuperacaoSenha = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
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
      // Regra obrigatória: usar explicitamente a URL única de recuperação dos Sistemas Ricci
      const redirectUrl = 'https://acessos-ricci.goskip.app/redefinir-senha'
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
        isAuthenticated: Boolean(!isPasswordRecovery && !isFirstAccess && user && user.is_admin),
        isLoading,
        authError,
        isPasswordRecovery,
        isFirstAccess,
        login,
        logout,
        solicitarRecuperacaoSenha,
        atualizarSenhaRecuperacao,
        cancelarRecuperacaoSenha,
        concluirPrimeiroAcesso,
        cancelarPrimeiroAcesso,
        marcarPrimeiroAcessoAtivo,
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
