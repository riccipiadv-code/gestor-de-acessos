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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Mail, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/lib/data/AuthContext'

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
  defaultEmail = '',
}: ForgotPasswordModalProps) {
  const { solicitarRecuperacaoSenha } = useAuth()
  const [email, setEmail] = useState(defaultEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setEmail(defaultEmail)
      setError(null)
      setSuccessMessage(null)
    }
  }, [open, defaultEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError('Por favor, informe o seu e-mail corporativo.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setError('Informe um formato de e-mail corporativo válido.')
      return
    }

    setLoading(true)
    try {
      const res = await solicitarRecuperacaoSenha(cleanEmail)
      if (res.success) {
        setSuccessMessage(res.message)
      } else {
        setError(res.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#1B4E8C]" />
            Recuperação de Senha
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Solicite o link corporativo seguro de redefinição de acesso via Supabase Auth.
          </DialogDescription>
        </DialogHeader>

        {successMessage ? (
          <div className="py-4 space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Solicitação enviada com sucesso!</span>
                <p className="leading-relaxed text-emerald-800">{successMessage}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">Supabase Auth:</span>
              <p>
                O envio do link de recuperação é gerenciado nativamente pelo Supabase Auth.
                Verifique também sua caixa de spam ou quarentena de e-mails corporativos.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                className="w-full text-xs bg-[#1B4E8C] hover:bg-[#163F73] text-white"
                onClick={() => onOpenChange(false)}
              >
                Voltar ao Login
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                As credenciais corporativas são gerenciadas exclusivamente pelo Supabase Auth.
                Nenhuma senha é exposta ou manipulada localmente.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recup-email" className="text-xs font-semibold text-slate-700">
                E-mail Corporativo
              </Label>
              <Input
                id="recup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@riccipi.com.br"
                className={error ? 'border-red-500 text-xs' : 'text-xs'}
                autoFocus
              />
              {error && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              )}
            </div>

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
                type="submit"
                size="sm"
                disabled={loading}
                className="text-xs bg-[#1B4E8C] hover:bg-[#163F73] text-white"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
