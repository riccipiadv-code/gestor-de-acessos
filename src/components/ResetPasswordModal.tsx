import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { KeyRound, ShieldAlert, CheckCircle2, Info, AlertCircle } from 'lucide-react'
import type { UsuarioComDetalhes } from '@/lib/data/types'
import { useAccess } from '@/lib/data/AccessContext'

interface ResetPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioComDetalhes | null
}

export function ResetPasswordModal({ open, onOpenChange, usuario }: ResetPasswordModalProps) {
  const { inviteOuResetSenha } = useAccess()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setSent(false)
      setLoading(false)
      setResultMessage(null)
      setError(null)
    }
  }, [open])

  if (!usuario) return null

  const handleConfirmReset = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inviteOuResetSenha(usuario.id)
      if (res.success) {
        setResultMessage(res.message || 'Solicitação despachada com sucesso.')
        setSent(true)
      } else {
        setError(res.error || 'Falha ao processar a ação de senha.')
      }
    } catch (err: unknown) {
      const e = err as Error
      setError(e?.message || 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#1B4E8C]" />
            Ação de Acesso e Senha
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Ação administrativa via Supabase Auth
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-4 space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Ação executada com sucesso!</span>
                <p className="leading-relaxed text-emerald-800">{resultMessage}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#1B4E8C]" />
                Segurança Supabase Auth:
              </span>
              <p>
                As credenciais e links de acesso são despachados diretamente pela Edge Function
                segura (manage-core-user) e pelo serviço GoTrue do Supabase.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                className="w-full text-xs bg-[#1B4E8C] hover:bg-[#163F73] text-white"
                onClick={() => onOpenChange(false)}
              >
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Usuário:</span>
                <span className="font-semibold text-slate-900">{usuario.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">E-mail:</span>
                <span className="font-mono font-medium text-slate-800">{usuario.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vínculo Auth:</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {usuario.auth_user_id ? 'Vinculado (Auth OK)' : 'Pendente de Convite'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`font-semibold ${usuario.ativo ? 'text-emerald-700' : 'text-red-600'}`}
                >
                  {usuario.ativo ? 'Ativo' : 'Inativo (Acessos Bloqueados)'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <span className="font-semibold block">Regra de Segurança Estrita:</span>
                <span>
                  O Gestor de Acesso nunca armazena senhas no frontend nem em colunas customizadas.
                  O link de acesso ou redefinição é gerado e despachado nativamente pelo Supabase
                  Auth.
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {usuario.auth_user_id
                ? 'Deseja disparar um e-mail de redefinição de senha para este usuário?'
                : 'Este usuário ainda não possui conta em auth.users. Deseja enviar o convite corporativo de acesso por e-mail?'}
            </p>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={handleConfirmReset}
                className="text-xs bg-[#1B4E8C] hover:bg-[#163F73] text-white"
              >
                {loading
                  ? 'Disparando...'
                  : usuario.auth_user_id
                    ? 'Confirmar e Enviar Redefinição'
                    : 'Enviar Convite de Acesso'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
