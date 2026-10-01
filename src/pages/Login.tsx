import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/data/AuthContext'
import { passwordRecoveryStorage } from '@/lib/data/passwordRecoveryStorage'
import { inviteSessionStorage } from '@/lib/data/inviteSessionStorage'
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isPasswordRecovery, isFirstAccess, authError } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)

  // Mensagem de sucesso recebida por navegação (ex: após redefinir senha com sucesso)
  const [sucessoMensagem, setSucessoMensagem] = useState<string | null>(() => {
    const state = location.state as { mensagemSucesso?: string } | null
    return state?.mensagemSucesso || null
  })

  // Se estiver em fluxo de convite ou de recuperação, redireciona para a rota apropriada
  React.useEffect(() => {
    if (
      isFirstAccess ||
      inviteSessionStorage.isPending() ||
      inviteSessionStorage.hasInviteUrlParams()
    ) {
      navigate('/primeiro-acesso', { replace: true })
      return
    }

    if (
      isPasswordRecovery ||
      passwordRecoveryStorage.isPending() ||
      passwordRecoveryStorage.hasRecoveryUrlParams()
    ) {
      navigate('/redefinir-senha', { replace: true })
      return
    }

    // Se já autenticado com autorização corporativa validada, vai direto para /usuarios
    if (isAuthenticated) {
      navigate('/usuarios', { replace: true })
    }
  }, [isAuthenticated, isPasswordRecovery, isFirstAccess, navigate])

  if (
    isFirstAccess ||
    inviteSessionStorage.isPending() ||
    inviteSessionStorage.hasInviteUrlParams()
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-xs text-slate-500 font-medium">
          Redirecionando para primeiro acesso...
        </div>
      </div>
    )
  }

  if (
    isPasswordRecovery ||
    passwordRecoveryStorage.isPending() ||
    passwordRecoveryStorage.hasRecoveryUrlParams()
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-xs text-slate-500 font-medium">
          Redirecionando para redefinição de senha...
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setFormError('Por favor, informe seu e-mail corporativo.')
      return
    }

    if (!senha) {
      setFormError('Por favor, informe sua senha.')
      return
    }

    setLoading(true)
    try {
      const res = await login(cleanEmail, senha)
      if (res.success) {
        navigate('/usuarios', { replace: true })
      } else {
        setFormError(res.error || 'Não foi possível realizar o login.')
      }
    } finally {
      setLoading(false)
    }
  }

  const displayedError = formError || authError

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937] flex flex-col justify-between antialiased">
      {/* Barra Superior Simples */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1B4E8C] to-[#0E7C7B] flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm tracking-tight">
              Gestor de Acesso Ricci
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-[#1B4E8C] border border-blue-200">
              Administrativo
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Controle Central de Acessos Corporativos
        </div>
      </header>

      {/* Cartão de Login */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Cabeçalho */}
          <div className="space-y-1 text-center">
            <div className="inline-flex w-12 h-12 rounded-xl bg-blue-50 text-[#1B4E8C] items-center justify-center mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Acesso ao Sistema</h1>
            <p className="text-xs text-slate-500">
              Entre com suas credenciais corporativas do Supabase Auth para gerenciar identidades e
              acessos.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {sucessoMensagem && !displayedError && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{sucessoMensagem}</span>
              </div>
            )}

            {displayedError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{displayedError}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                E-mail Corporativo
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@riccipi.com.br"
                  className="pl-9 text-xs"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha" className="text-xs font-semibold text-slate-700">
                  Senha
                </Label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] font-medium text-[#1B4E8C] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9 text-xs"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Botão Entrar */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-xs font-semibold bg-[#1B4E8C] hover:bg-[#163F73] text-white h-10 shadow-xs mt-2"
            >
              {loading ? (
                'Autenticando...'
              ) : (
                <>
                  Entrar no Gestor
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          {/* Nota de Segurança Corporativa */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-[11px] text-slate-600">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-semibold text-slate-800">Autenticação Centralizada:</span>
                <p>
                  O acesso requer vínculo ativo em <code>core_usuarios</code> e perfil de
                  Administrador no sistema Gestor de Acesso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="h-12 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} <span className="font-semibold text-slate-700">Ricci</span> —
          Gestor de Acesso
        </div>
        <div className="text-[11px] text-slate-400 font-mono">Autenticação Segura</div>
      </footer>

      {/* Modal Esqueci Minha Senha */}
      <ForgotPasswordModal
        open={forgotModalOpen}
        onOpenChange={setForgotModalOpen}
        defaultEmail={email}
      />
    </div>
  )
}
