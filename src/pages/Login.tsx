import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/data/AuthContext'
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('antonio.ricci@riccipi.com.br')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)

  // Se já autenticado, pode ir direto para Usuários
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/usuarios', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail institucional.')
      return
    }

    setLoading(true)
    try {
      const res = await login(cleanEmail, senha)
      if (res.success) {
        navigate('/usuarios', { replace: true })
      } else {
        setError(res.error || 'Não foi possível realizar o login.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937] flex flex-col justify-between antialiased">
      {/* Top Simple Bar */}
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

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Card Header */}
          <div className="space-y-1 text-center">
            <div className="inline-flex w-12 h-12 rounded-xl bg-blue-50 text-[#1B4E8C] items-center justify-center mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Acesso ao Sistema</h1>
            <p className="text-xs text-slate-500">
              Entre com suas credenciais corporativas para gerenciar identidades e acessos.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
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
                />
              </div>
            </div>

            {/* Submit Button */}
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

          {/* Security Architecture Note */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-[11px] text-slate-600">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-semibold text-slate-800">Ambiente Corporativo Seguro:</span>
                <p>
                  A autenticação definitiva será delegada ao Supabase Auth (auth.users). Nenhuma
                  senha é armazenada ou mantida na camada de interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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
