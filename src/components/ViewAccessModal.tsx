import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Layers } from 'lucide-react'
import type { UsuarioComDetalhes } from '@/lib/data/types'

interface ViewAccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioComDetalhes | null
}

export function ViewAccessModal({ open, onOpenChange, usuario }: ViewAccessModalProps) {
  if (!usuario) return null

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white p-6 rounded-xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 bg-[#1B4E8C] text-white">
              <AvatarFallback className="bg-[#1B4E8C] text-white font-semibold">
                {getInitials(usuario.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {usuario.nome}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {usuario.email} •{' '}
                {usuario.gestorNome ? `Gestor: ${usuario.gestorNome}` : 'Sem gestor vinculado'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Status Geral e Regra de Desligamento */}
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 ${
              usuario.ativo
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-red-50/70 border-red-200 text-red-900'
            }`}
          >
            {usuario.ativo ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider">
                  Status Corporativo:
                </span>
                <Badge
                  className={
                    usuario.ativo
                      ? 'bg-emerald-600 text-white hover:bg-emerald-600 text-[10px]'
                      : 'bg-red-600 text-white hover:bg-red-600 text-[10px]'
                  }
                >
                  {usuario.ativo ? 'Ativo no Ecossistema' : 'Inativo / Bloqueado'}
                </Badge>
              </div>
              <p className="text-xs leading-relaxed">
                {usuario.ativo
                  ? 'A credencial corporativa está ativa. O usuário acessa os sistemas autorizados abaixo com seus respectivos perfis.'
                  : 'ATENÇÃO: Usuário inativo não acessa nenhum sistema. Mesmo que existam vínculos técnicos cadastrados abaixo, todo o acesso efetivo permanece universalmente bloqueado.'}
              </p>
            </div>
          </div>

          {/* Vínculo Supabase Auth */}
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between">
            <span className="font-medium">Identificador Supabase Auth (auth_user_id):</span>
            <span className="font-mono text-[11px] font-semibold text-slate-800">
              {usuario.auth_user_id || 'Não vinculado ao Auth'}
            </span>
          </div>

          {/* Lista de Acessos aos Sistemas */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              Sistemas e Perfis Vinculados
            </h4>

            {usuario.sistemasAcesso.length === 0 ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500">Nenhum sistema atribuído a este usuário.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {usuario.sistemasAcesso.map((acesso) => {
                  return (
                    <div
                      key={acesso.sistemaId}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {acesso.sistemaNome}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {acesso.sistemaCodigo}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <span className="font-medium text-[#1B4E8C]">
                            Perfil: {acesso.perfilNome}
                          </span>
                        </div>
                      </div>

                      {/* Chip de Acesso Efetivo */}
                      <div>
                        {acesso.acessoEfetivo ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Acesso Permitido
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-[11px] flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Sem acesso — inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
