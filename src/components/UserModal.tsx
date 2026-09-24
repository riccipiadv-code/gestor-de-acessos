import React, { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, ShieldAlert, Check, Layers } from 'lucide-react'
import type {
  UsuarioComDetalhes,
  SistemaComEstatisticas,
  PerfilComEstatisticas,
} from '@/lib/data/types'

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuarioParaEditar: UsuarioComDetalhes | null
  todosUsuarios: UsuarioComDetalhes[]
  sistemas: SistemaComEstatisticas[]
  perfis: PerfilComEstatisticas[]
  onSave: (dados: {
    nome: string
    email: string
    ativo: boolean
    gestor_id: string | null
    sistemas: { sistema_id: string; perfil_id: string }[]
    send_invite?: boolean
  }) => Promise<void>
}

interface SistemaSelection {
  sistema_id: string
  selecionado: boolean
  perfil_id: string
}

export function UserModal({
  open,
  onOpenChange,
  usuarioParaEditar,
  todosUsuarios,
  sistemas,
  perfis,
  onSave,
}: UserModalProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [gestorId, setGestorId] = useState<string>('none')
  const [sendInvite, setSendInvite] = useState(true)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [sistemasState, setSistemasState] = useState<Record<string, SistemaSelection>>({})
  const [errors, setErrors] = useState<{
    nome?: string
    email?: string
    gestor?: string
    perfis?: Record<string, string>
  }>({})

  // Carrega ou reseta estado ao abrir
  useEffect(() => {
    if (!open) return

    setServerError(null)
    setSaving(false)

    if (usuarioParaEditar) {
      setNome(usuarioParaEditar.nome)
      setEmail(usuarioParaEditar.email)
      setAtivo(usuarioParaEditar.ativo)
      setGestorId(usuarioParaEditar.gestor_id || 'none')
      setSendInvite(false)

      const initialSistemas: Record<string, SistemaSelection> = {}
      sistemas.forEach((s) => {
        const acessoExistente = usuarioParaEditar.sistemasAcesso.find((a) => a.sistemaId === s.id)
        initialSistemas[s.id] = {
          sistema_id: s.id,
          selecionado: Boolean(acessoExistente),
          perfil_id: acessoExistente ? acessoExistente.perfilId : '',
        }
      })
      setSistemasState(initialSistemas)
    } else {
      setNome('')
      setEmail('')
      setAtivo(true)
      setGestorId('none')
      setSendInvite(true)

      const initialSistemas: Record<string, SistemaSelection> = {}
      sistemas.forEach((s) => {
        initialSistemas[s.id] = {
          sistema_id: s.id,
          selecionado: false,
          perfil_id: '',
        }
      })
      setSistemasState(initialSistemas)
    }

    setErrors({})
  }, [open, usuarioParaEditar, sistemas])

  const handleToggleSistema = (sistemaId: string, checked: boolean) => {
    setSistemasState((prev) => {
      const atual = prev[sistemaId]
      return {
        ...prev,
        [sistemaId]: {
          sistema_id: sistemaId,
          selecionado: checked,
          perfil_id: checked ? atual?.perfil_id || '' : '',
        },
      }
    })

    if (!checked) {
      setErrors((prev) => {
        const newPerfis = { ...prev.perfis }
        delete newPerfis[sistemaId]
        return { ...prev, perfis: newPerfis }
      })
    }
  }

  const handleSelectPerfil = (sistemaId: string, perfilId: string) => {
    setSistemasState((prev) => ({
      ...prev,
      [sistemaId]: {
        ...prev[sistemaId],
        perfil_id: perfilId,
      },
    }))

    setErrors((prev) => {
      const newPerfis = { ...prev.perfis }
      delete newPerfis[sistemaId]
      return { ...prev, perfis: newPerfis }
    })
  }

  const validate = (): boolean => {
    const newErrors: {
      nome?: string
      email?: string
      gestor?: string
      perfis?: Record<string, string>
    } = { perfis: {} }

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Informe um endereço de e-mail corporativo válido'
      }
    }

    // Não permitir gestor igual ao próprio usuário
    if (usuarioParaEditar && gestorId !== 'none' && gestorId === usuarioParaEditar.id) {
      newErrors.gestor = 'O usuário não pode ser gestor de si mesmo'
    }

    // Regra estrita: sistema habilitado = perfil daquele sistema obrigatório
    let hasPerfilError = false
    Object.values(sistemasState).forEach((item) => {
      if (item.selecionado && !item.perfil_id) {
        const sis = sistemas.find((s) => s.id === item.sistema_id)
        const nomeSistema = sis?.nome || 'este sistema'
        if (newErrors.perfis) {
          newErrors.perfis[item.sistema_id] = `Selecione um perfil para ${nomeSistema}`
          hasPerfilError = true
        }
      }
    })

    setErrors(newErrors)
    return !newErrors.nome && !newErrors.email && !newErrors.gestor && !hasPerfilError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return

    const sistemasSelecionados = Object.values(sistemasState)
      .filter((s) => s.selecionado && Boolean(s.perfil_id))
      .map((s) => ({
        sistema_id: s.sistema_id,
        perfil_id: s.perfil_id,
      }))

    setSaving(true)
    try {
      await onSave({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        ativo,
        gestor_id: gestorId === 'none' ? null : gestorId,
        sistemas: sistemasSelecionados,
        send_invite: sendInvite,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const e = err as Error
      setServerError(e?.message || 'Erro ao salvar o usuário.')
    } finally {
      setSaving(false)
    }
  }

  // A lista de gestores deve mostrar apenas usuários corporativos ativos (e não ele próprio)
  const possiveisGestores = todosUsuarios.filter((u) => u.ativo && u.id !== usuarioParaEditar?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {usuarioParaEditar ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {usuarioParaEditar
              ? 'Atualize os dados principais e defina o perfil de acesso em cada sistema.'
              : 'Cadastre o usuário corporativo e configure as permissões por sistema.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Seção 1: Dados Principais (Nome, E-mail, Gestor, Ativo) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-[#1B4E8C]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Dados Principais
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nome" className="text-xs font-semibold text-slate-700">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Mariana Duarte Ramos"
                  className={errors.nome ? 'border-red-500 text-xs' : 'text-xs'}
                />
                {errors.nome && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.nome}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    E-mail Corporativo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@riccipi.com.br"
                    className={errors.email ? 'border-red-500 text-xs' : 'text-xs'}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Gestor: Apenas usuários corporativos ativos */}
                <div className="space-y-1.5">
                  <Label htmlFor="gestor" className="text-xs font-semibold text-slate-700">
                    Gestor Responsável
                  </Label>
                  <Select value={gestorId} onValueChange={setGestorId}>
                    <SelectTrigger id="gestor" className="text-xs">
                      <SelectValue placeholder="Selecione o gestor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">
                        Nenhum (Diretoria / Sócio)
                      </SelectItem>
                      {possiveisGestores.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="text-xs">
                          {g.nome} ({g.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gestor && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {errors.gestor}
                    </p>
                  )}
                </div>
              </div>

              {/* Convite por e-mail para novo usuário */}
              {!usuarioParaEditar && (
                <div className="space-y-1 sm:col-span-2 p-3 bg-blue-50/50 border border-blue-200/70 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="send-invite"
                      className="text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      Enviar Convite por E-mail (Supabase Auth)
                    </Label>
                    <Switch id="send-invite" checked={sendInvite} onCheckedChange={setSendInvite} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Dispara automaticamente o link de primeiro acesso para criação de senha via
                    GoTrue.
                  </p>
                </div>
              )}

              {/* Switch Ativo / Inativo com aviso de bloqueio universal */}
              <div className="space-y-1.5 sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ativo" className="text-xs font-bold text-slate-800 block">
                      Status do Usuário
                    </Label>
                    <span className="text-[11px] text-slate-500">
                      Usuário ativo pode autenticar e acessar os sistemas autorizados.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        ativo ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
                  </div>
                </div>
                {!ativo && (
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-start gap-2 text-[11px] text-red-800 bg-red-50 p-2 rounded">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <span>
                      <strong>Atenção:</strong> Usuário inativo tem todos os acessos bloqueados
                      imediatamente, independente das permissões configuradas abaixo.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Acesso aos Sistemas (Habilitar acesso + Perfil obrigatório) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1B4E8C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Acesso aos Sistemas
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Habilitado = perfil obrigatório • Desabilitado = sem acesso
              </span>
            </div>

            <div className="space-y-3">
              {sistemas.map((sistema) => {
                const selection = sistemasState[sistema.id] || {
                  sistema_id: sistema.id,
                  selecionado: false,
                  perfil_id: '',
                }

                // Perfis disponíveis pertencentes a este sistema
                const perfisDoSistema = perfis.filter((p) => p.sistema_id === sistema.id && p.ativo)
                const hasError = Boolean(errors.perfis?.[sistema.id])

                return (
                  <div
                    key={sistema.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      selection.selecionado
                        ? 'border-[#1B4E8C]/40 bg-blue-50/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`sis-${sistema.id}`}
                          checked={selection.selecionado}
                          onCheckedChange={(checked) =>
                            handleToggleSistema(sistema.id, Boolean(checked))
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <Label
                            htmlFor={`sis-${sistema.id}`}
                            className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-2"
                          >
                            <span>{sistema.nome}</span>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {sistema.codigo}
                            </span>
                            {!sistema.ativo && (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Sistema inativo
                              </span>
                            )}
                          </Label>
                          {sistema.descricao && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{sistema.descricao}</p>
                          )}
                        </div>
                      </div>

                      {/* Status de Habilitação */}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                          selection.selecionado
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {selection.selecionado ? 'Acesso: Ativo' : 'Acesso: Desabilitado'}
                      </span>
                    </div>

                    {/* Quando habilitado: seleção OBRIGATÓRIA do perfil do usuário naquele sistema */}
                    {selection.selecionado && (
                      <div className="mt-3 pl-7 pt-3 border-t border-slate-200/60 space-y-1.5">
                        <Label
                          htmlFor={`perfil-${sistema.id}`}
                          className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                        >
                          Perfil do Usuário em {sistema.nome}{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={selection.perfil_id || ''}
                          onValueChange={(val) => handleSelectPerfil(sistema.id, val)}
                        >
                          <SelectTrigger
                            id={`perfil-${sistema.id}`}
                            className={`text-xs bg-white ${
                              hasError ? 'border-red-500 ring-1 ring-red-500' : ''
                            }`}
                          >
                            <SelectValue placeholder={`Selecione o perfil em ${sistema.nome}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {perfisDoSistema.map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                <div className="flex flex-col text-left">
                                  <span className="font-medium text-slate-900">{p.nome}</span>
                                  {p.descricao && (
                                    <span className="text-[10px] text-slate-500">
                                      {p.descricao}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {hasError && (
                          <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            {errors.perfis?.[sistema.id]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="text-xs bg-[#1B4E8C] hover:bg-[#163F73] text-white"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {saving
                ? 'Salvando...'
                : usuarioParaEditar
                  ? 'Salvar Alterações'
                  : 'Cadastrar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
