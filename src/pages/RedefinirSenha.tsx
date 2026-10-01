import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/data/AuthContext'

export default function RedefinirSenhaPage() {
  const navigate = useNavigate()
  const {
    authUser,
    isPasswordRecovery,
    isLoading,
    atualizarSenhaRecuperacao,
    cancelarRecuperacaoSenha,
  } = useAuth()

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  // Validação dos requisitos de senha
  const temTamanhoMinimo = novaSenha.length >= 8
  const temLetra = /[a-zA-Z]/.test(novaSenha)
  const temNumero = /[0-9]/.test(novaSenha)
  const senhasConferem = novaSenha.length > 0 && novaSenha === confirmacaoSenha

  // Se não estiver em recovery e não estiver carregando, encerra qualquer sessão local existente
  React.useEffect(() => {
    if (!isLoading && !isPasswordRecovery) {
      cancelarRecuperacaoSenha()
    }
  }, [isLoading, isPasswordRecovery, cancelarRecuperacaoSenha])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    // Bloqueio rigoroso: não permitir submissão sem sessão de recovery válida
    if (!isPasswordRecovery) {
      setErro('O link de recuperação é inválido ou já expirou. Solicite um novo link.')
      return
    }

    if (!novaSenha) {
      setErro('Por favor, informe a nova senha.')
      return
    }

    if (novaSenha.length < 8) {
      setErro('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (!temLetra || !temNumero) {
      setErro('A nova senha deve conter pelo menos uma letra e um número.')
      return
    }

    if (novaSenha !== confirmacaoSenha) {
      setErro('A confirmação não confere com a nova senha digitada.')
      return
    }

    setLoading(true)
    try {
      const res = await atualizarSenhaRecuperacao(novaSenha)
      if (res.success) {
        setSucesso(true)
      } else {
        setErro(res.error || 'Não foi possível atualizar sua senha. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVoltarLogin = async () => {
    const eraSucesso = sucesso
    if (!eraSucesso) {
      await cancelarRecuperacaoSenha()
    }
    navigate('/login', {
      replace: true,
      state: eraSucesso
        ? { mensagemSucesso: 'Senha redefinida com sucesso. Faça login com a sua nova senha.' }
        : undefined,
    })
  }

  // Estado inválido / expirado / ausente
  const linkInvalido = !isLoading && !isPasswordRecovery && !sucesso

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
              Segurança
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Redefinição Segura de Senha Corporativa
        </div>
      </header>

      {/* Cartão Central */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {sucesso ? (
            <div className="space-y-5 text-center">
              <div className="inline-flex w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Senha Redefinida com Sucesso
                </h1>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Senha redefinida com sucesso. Você já pode utilizar sua nova senha para acessar os
                  sistemas Ricci aos quais possui permissão.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  onClick={handleVoltarLogin}
                  className="w-full text-xs font-semibold bg-[#1B4E8C] hover:bg-[#163F73] text-white h-10 shadow-xs"
                >
                  Ir a Gestor de Acesso
                </Button>
                <Button
                  type="button"
                  asChild
                  variant="outline"
                  className="w-full text-xs font-semibold border-slate-300 hover:bg-slate-50 text-slate-700 h-10 shadow-xs"
                >
                  <a href="https://conectai.goskip.app/login">Ir para o Conectaí</a>
                </Button>
                <Button
                  type="button"
                  asChild
                  variant="outline"
                  className="w-full text-xs font-semibold border-slate-300 hover:bg-slate-50 text-slate-700 h-10 shadow-xs"
                >
                  <a href="https://ricci-task.goskip.app/login">Ir para o Ricci Task</a>
                </Button>
              </div>
            </div>
          ) : linkInvalido ? (
            <div className="space-y-5 text-center">
              <div className="inline-flex w-14 h-14 rounded-full bg-amber-50 text-amber-600 items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Link Inválido ou Expirado
                </h1>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O link de recuperação de senha utilizado é inválido, expirou ou já foi utilizado
                  anteriormente. Por segurança, nenhuma alteração de credencial pode ser realizada.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-left space-y-1">
                <span className="font-semibold text-slate-800">O que fazer:</span>
                <p>
                  Retorne à tela inicial e solicite um novo link de redefinição de senha para o seu
                  e-mail corporativo.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleVoltarLogin}
                className="w-full text-xs font-semibold bg-[#1B4E8C] hover:bg-[#163F73] text-white h-10 shadow-xs"
              >
                Solicitar Novo Link no Login
              </Button>
            </div>
          ) : (
            <>
              {/* Cabeçalho */}
              <div className="space-y-1 text-center">
                <div className="inline-flex w-12 h-12 rounded-xl bg-blue-50 text-[#1B4E8C] items-center justify-center mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Definir Nova Senha
                </h1>
                <p className="text-xs text-slate-500">
                  {authUser?.email ? (
                    <>
                      Cadastre a nova senha para o usuário{' '}
                      <strong className="text-slate-700">{authUser.email}</strong>.
                    </>
                  ) : (
                    'Cadastre e confirme sua nova senha de acesso corporativo.'
                  )}
                </p>
              </div>

              {/* Formulário funcional — só acessível se isPasswordRecovery === true */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {erro && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{erro}</span>
                  </div>
                )}

                {/* Nova Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="novaSenha" className="text-xs font-semibold text-slate-700">
                      Nova Senha
                    </Label>
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      {mostrarSenha ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Mostrar
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="novaSenha"
                      type={mostrarSenha ? 'text' : 'password'}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      className="pl-9 text-xs"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {/* Confirmar Nova Senha */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmacaoSenha"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="confirmacaoSenha"
                      type={mostrarSenha ? 'text' : 'password'}
                      value={confirmacaoSenha}
                      onChange={(e) => setConfirmacaoSenha(e.target.value)}
                      placeholder="Digite a mesma senha novamente"
                      className="pl-9 text-xs"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {/* Requisitos visuais */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                  <span className="font-semibold text-slate-700 block">
                    Critérios de segurança:
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          temTamanhoMinimo ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <span
                        className={
                          temTamanhoMinimo ? 'text-emerald-700 font-medium' : 'text-slate-500'
                        }
                      >
                        Pelo menos 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          temLetra && temNumero ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <span
                        className={
                          temLetra && temNumero ? 'text-emerald-700 font-medium' : 'text-slate-500'
                        }
                      >
                        Contém letras e números
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          senhasConferem ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <span
                        className={
                          senhasConferem ? 'text-emerald-700 font-medium' : 'text-slate-500'
                        }
                      >
                        Senhas idênticas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    disabled={
                      loading || !temTamanhoMinimo || !temLetra || !temNumero || !senhasConferem
                    }
                    className="w-full text-xs font-semibold bg-[#1B4E8C] hover:bg-[#163F73] text-white h-10 shadow-xs"
                  >
                    {loading ? 'Atualizando senha...' : 'Salvar Nova Senha'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleVoltarLogin}
                    className="w-full text-xs text-slate-600 hover:text-slate-900 h-9"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Cancelar e voltar ao login
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Rodapé */}
      <footer className="h-12 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} <span className="font-semibold text-slate-700">Ricci</span> —
          Gestor de Acesso
        </div>
        <div className="text-[11px] text-slate-400 font-mono">Autenticação Corporativa Segura</div>
      </footer>
    </div>
  )
}
