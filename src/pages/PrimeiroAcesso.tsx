import React, { useState, useEffect } from 'react'
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/data/AuthContext'
import { inviteSessionStorage } from '@/lib/data/inviteSessionStorage'

type InviteStatus = 'checking' | 'valid' | 'invalid' | 'success'

export default function PrimeiroAcessoPage() {
  const { authUser, concluirPrimeiroAcesso, marcarPrimeiroAcessoAtivo } = useAuth()

  const [status, setStatus] = useState<InviteStatus>('checking')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [invitedEmail, setInvitedEmail] = useState<string>('')

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Critérios de senha (idênticos aos de redefinição de senha)
  const temTamanhoMinimo = novaSenha.length >= 8
  const temLetra = /[a-zA-Z]/.test(novaSenha)
  const temNumero = /[0-9]/.test(novaSenha)
  const senhasConferem = novaSenha.length > 0 && novaSenha === confirmacaoSenha

  useEffect(() => {
    let isMounted = true

    const validateInvite = async () => {
      // 1. Verificar se há erro explícito na URL (link expirado, inválido etc.)
      const urlError = inviteSessionStorage.getInviteErrorFromUrl()
      if (urlError) {
        if (!isMounted) return
        inviteSessionStorage.clear()
        setStatus('invalid')
        setStatusMessage(
          urlError ||
            'Este link de convite é inválido ou já expirou. Solicite um novo convite ao administrador.',
        )
        return
      }

      // 2. Se a URL tiver token_hash com type=invite, executar verifyOtp (fluxo de token do Supabase Auth)
      const otpParams = inviteSessionStorage.getInviteOtpParams()
      if (otpParams?.token_hash && otpParams.type === 'invite') {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: otpParams.token_hash,
            type: 'invite',
          })

          if (!isMounted) return

          if (error) {
            inviteSessionStorage.clear()
            setStatus('invalid')
            setStatusMessage(
              'O link de convite é inválido ou já expirou. Solicite um novo convite ao administrador.',
            )
            return
          }

          if (data.session && data.user) {
            marcarPrimeiroAcessoAtivo(data.user.id, data.user.email)
            setInvitedEmail(data.user.email || '')
            setStatus('valid')
            return
          }
        } catch {
          if (!isMounted) return
          inviteSessionStorage.clear()
          setStatus('invalid')
          setStatusMessage(
            'Falha ao validar o convite de primeiro acesso. Solicite um novo convite ao administrador.',
          )
          return
        }
      }

      // 3. Se a URL tiver hash com access_token e type=invite (fluxo de redirecionamento do Supabase Auth)
      const hasInviteParams = inviteSessionStorage.hasInviteUrlParams()
      const storageData = inviteSessionStorage.getData()
      const isAlreadyVerified = inviteSessionStorage.isVerified()

      // Obter sessão atual
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      if (!session?.user) {
        // Sem sessão e sem parâmetros válidos
        inviteSessionStorage.clear()
        setStatus('invalid')
        setStatusMessage(
          'Nenhum convite válido foi identificado. Se você recebeu um link por e-mail, abra-o novamente ou solicite um novo convite ao administrador.',
        )
        return
      }

      // Se há sessão ativa no Supabase:
      // A presença de type=invite na URL, uma flag no storage ou uma sessão comum NÃO deve,
      // isoladamente, ser considerada prova de convite válido.
      // Validamos a coerência entre a sessão e o convite:
      // Caso 3a: A URL atual traz tokens de convite (hash com access_token e type=invite)
      if (hasInviteParams) {
        marcarPrimeiroAcessoAtivo(session.user.id, session.user.email)
        setInvitedEmail(session.user.email || '')
        setStatus('valid')
        return
      }

      // Caso 3b: Já estava comprovadamente validado no storage (ex: reload/F5 ou navegação na mesma sessão),
      // e o userId salvo no storage confere rigorosamente com a sessão atual
      if (isAlreadyVerified && storageData?.userId === session.user.id) {
        marcarPrimeiroAcessoAtivo(session.user.id, session.user.email)
        setInvitedEmail(session.user.email || '')
        setStatus('valid')
        return
      }

      // Caso 3c: Sessão comum pré-existente (sem prova de convite legítimo)
      // Bloqueia rigorosamente o formulário e instrui o usuário
      inviteSessionStorage.clear()
      setStatus('invalid')
      setStatusMessage(
        'Este link de convite é inválido, expirou ou já foi utilizado. Solicite um novo convite ao administrador.',
      )
    }

    validateInvite()

    return () => {
      isMounted = false
    }
  }, [marcarPrimeiroAcessoAtivo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (status !== 'valid') {
      setErro(
        'Não é possível cadastrar a senha: o convite não foi validado. Solicite um novo convite ao administrador.',
      )
      return
    }

    if (!novaSenha) {
      setErro('Por favor, informe a senha.')
      return
    }

    if (novaSenha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (!temLetra || !temNumero) {
      setErro('A senha deve conter pelo menos uma letra e um número.')
      return
    }

    if (novaSenha !== confirmacaoSenha) {
      setErro('A confirmação não confere com a senha digitada.')
      return
    }

    setLoading(true)
    try {
      const res = await concluirPrimeiroAcesso(novaSenha)
      if (res.success) {
        setStatus('success')
      } else {
        setErro(res.error || 'Não foi possível cadastrar sua senha. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const emailExibicao = invitedEmail || authUser?.email || ''

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937] flex flex-col justify-between antialiased">
      {/* Barra Superior Simples */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1B4E8C] to-[#0E7C7B] flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm tracking-tight">Sistemas Ricci</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-[#1B4E8C] border border-blue-200">
              Primeiro Acesso
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Definição Segura de Senha Corporativa
        </div>
      </header>

      {/* Cartão Central */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* 1. Verificando convite */}
          {status === 'checking' && (
            <div className="space-y-4 text-center py-6">
              <div className="inline-flex w-12 h-12 rounded-xl bg-blue-50 text-[#1B4E8C] items-center justify-center animate-pulse">
                <KeyRound className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Validando convite...
                </h1>
                <p className="text-xs text-slate-500">
                  Aguarde enquanto verificamos a autenticidade do seu link de primeiro acesso.
                </p>
              </div>
            </div>
          )}

          {/* 2. Tela de Conclusão / Sucesso */}
          {status === 'success' && (
            <div className="space-y-5 text-center">
              <div className="inline-flex w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Senha cadastrada com sucesso.
                </h1>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Você já pode utilizar seu e-mail e sua senha para acessar os sistemas Ricci aos
                  quais possui permissão.
                </p>
              </div>

              {/* Botões para os sistemas destino (mesma aba, por clique, sem botão do Gestor) */}
              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  asChild
                  className="w-full text-xs font-semibold bg-[#1B4E8C] hover:bg-[#163F73] text-white h-10 shadow-xs"
                >
                  <a
                    href="https://conectai.goskip.app/login"
                    className="flex items-center justify-center gap-1.5"
                  >
                    Ir para o Conectaí
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
                <Button
                  type="button"
                  asChild
                  variant="outline"
                  className="w-full text-xs font-semibold border-slate-300 hover:bg-slate-50 text-slate-700 h-10 shadow-xs"
                >
                  <a
                    href="https://ricci-task.goskip.app/login"
                    className="flex items-center justify-center gap-1.5"
                  >
                    Ir para o Ricci Task
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* 3. Link Inválido ou Expirado */}
          {status === 'invalid' && (
            <div className="space-y-5 text-center">
              <div className="inline-flex w-14 h-14 rounded-full bg-amber-50 text-amber-600 items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Convite Inválido ou Expirado
                </h1>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {statusMessage ||
                    'O link de convite utilizado é inválido, expirou ou já foi utilizado anteriormente. Por segurança, nenhuma senha pode ser definida por este link.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-left space-y-1">
                <span className="font-semibold text-slate-800">O que fazer:</span>
                <p>
                  Entre em contato com o administrador dos Sistemas Ricci e solicite o reenvio de um
                  novo convite para o seu e-mail corporativo.
                </p>
              </div>
            </div>
          )}

          {/* 4. Formulário de Definição da Primeira Senha (status === 'valid') */}
          {status === 'valid' && (
            <>
              <div className="space-y-1 text-center">
                <div className="inline-flex w-12 h-12 rounded-xl bg-blue-50 text-[#1B4E8C] items-center justify-center mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Definir Primeira Senha
                </h1>
                <p className="text-xs text-slate-500">
                  {emailExibicao ? (
                    <>
                      Cadastre a senha para o usuário{' '}
                      <strong className="text-slate-700">{emailExibicao}</strong>.
                    </>
                  ) : (
                    'Cadastre e confirme sua senha de acesso aos Sistemas Ricci.'
                  )}
                </p>
              </div>

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
                    <Label
                      htmlFor="novaSenhaPrimeiroAcesso"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Senha
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
                      id="novaSenhaPrimeiroAcesso"
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
                    htmlFor="confirmacaoSenhaPrimeiroAcesso"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="confirmacaoSenhaPrimeiroAcesso"
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

                {/* Botão de envio */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={
                      loading || !temTamanhoMinimo || !temLetra || !temNumero || !senhasConferem
                    }
                    className="w-full text-xs font-semibold bg-[#1B4E8C] hover:bg-[#163F73] text-white h-10 shadow-xs"
                  >
                    {loading ? 'Cadastrando senha...' : 'Salvar Senha'}
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
