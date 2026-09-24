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
import { AlertCircle, ShieldAlert, Check } from 'lucide-react'
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
    legaldesk_usuario_id?: string | null
    sistemas: { sistema_id: string; perfil_id: string }[]
  }) => void
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
  const [legaldeskId, setLegaldeskId] = useState('')
  const [sistemasState, setSistemasState] = useState<Record<string, SistemaSelection>>({})
  const [errors, setErrors] = useState<{
    nome?: string
    email?: string
    perfis?: Record<string, string>
  }>({})

  // Carrega ou reseta estado ao abrir
  useEffect(() => {
    if (!open) return

    if (usuarioParaEditar) {
      setNome(usuarioParaEditar.nome)
      setEmail(usuarioParaEditar.email)
      setAtivo(usuarioParaEditar.ativo)
      setGestorId(usuarioParaEditar.gestor_id || 'none')
      setLegaldeskId(usuarioParaEditar.legaldesk_usuario_id || '')

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
      setLegaldeskId('')

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
          // Se desmarcou, limpa perfil
          perfil_id: checked ? atual?.perfil_id || '' : '',
        },
      }
    })

    // Limpa erro inline do perfil
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
        newErrors.email = 'Informe um endereço de e-mail válido'
      }
    }

    // Validação estrita: para todo sistema marcado, o perfil é OBRIGATÓRIO
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
    return !newErrors.nome && !newErrors.email && !hasPerfilError
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Filtra apenas os sistemas marcados
    const sistemasSelecionados = Object.values(sistemasState)
      .filter((s) => s.selecionado && Boolean(s.perfil_id))
      .map((s) => ({
        sistema_id: s.sistema_id,
        perfil_id: s.perfil_id,
      }))

    onSave({
      nome,
      email,
      ativo,
      gestor_id: gestorId === 'none' ? null : gestorId,
      legaldesk_usuario_id: legaldeskId.trim() || null,
      sistemas: sistemasSelecionados,
    })

    onOpenChange(false)
  }

  // Usuários elegíveis para ser gestor (não pode ser ele mesmo)
  const possiveisGestores = todosUsuarios.filter((u) => u.id !== usuarioParaEditar?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {usuarioParaEditar ? 'Editar Usuário Corporativo' : 'Novo Usuário Corporativo'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {usuarioParaEditar
              ? 'Atualize os dados e acessos centrais aos sistemas corporativos.'
              : 'Cadastre a identidade central e defina as credenciais por sistema.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Seção 1: Dados do Usuário */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-[#1B4E8C]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Dados Corporativos
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
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.nome}
                  </p>
                )}
              </div>

              {/* Email */}
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
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Gestor Imediato */}
              <div className="space-y-1.5">
                <Label htmlFor="gestor" className="text-xs font-semibold text-slate-700">
                  Gestor Imediato
                </Label>
                <Select value={gestorId} onValueChange={setGestorId}>
                  <SelectTrigger id="gestor" className="text-xs">
                    <SelectValue placeholder="Selecione o gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (nível diretor/executivo)</SelectItem>
                    {possiveisGestores.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nome} ({g.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vínculo LegalDesk */}
              <div className="space-y-1.5">
                <Label htmlFor="legaldesk" className="text-xs font-semibold text-slate-700">
                  Vínculo LegalDesk <span className="text-slate-400 font-normal">(opcional)</span>
                </Label>
                <Input
                  id="legaldesk"
                  value={legaldeskId}
                  onChange={(e) => setLegaldeskId(e.target.value)}
                  placeholder="Ex.: LD-042"
                  className="font-mono text-xs"
                />
              </div>

              {/* Switch Ativo com Nota Explícita */}
              <div className="space-y-1.5 sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ativo" className="text-xs font-bold text-slate-800 block">
                      Status Corporativo da Conta
                    </Label>
                    <span className="text-[11px] text-slate-500">
                      Define se a credencial central está ativa ou suspensa
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
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    <strong>Regra Global de Desligamento:</strong> Usuário inativo não acessa nenhum
                    sistema. A alteração aqui bloqueia o acesso corporativo imediatamente.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Acesso aos Sistemas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0E7C7B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Acesso aos Sistemas e Perfis
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Perfis pertencem ao sistema específico
              </span>
            </div>

            <div className="space-y-3">
              {sistemas.map((sistema) => {
                const selection = sistemasState[sistema.id] || {
                  sistema_id: sistema.id,
                  selecionado: false,
                  perfil_id: '',
                }

                // Perfis disponíveis para este sistema
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
                                Inativo no momento
                              </span>
                            )}
                          </Label>
                          <p className="text-[11px] text-slate-500 mt-0.5">{sistema.descricao}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quando marcado: exibição OBRIGATÓRIA do select de perfil */}
                    {selection.selecionado && (
                      <div className="mt-3 pl-7 pt-3 border-t border-slate-200/60 space-y-1.5">
                        <Label
                          htmlFor={`perfil-${sistema.id}`}
                          className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                        >
                          Perfil de Acesso em {sistema.nome} <span className="text-red-500">*</span>
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
                            <SelectValue placeholder={`Selecione o perfil para ${sistema.nome}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {perfisDoSistema.map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">{p.nome}</span>
                                  <span className="text-[10px] text-slate-500">{p.descricao}</span>
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
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" className="text-xs bg-[#1B4E8C] hover:bg-[#163F73] text-white">
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {usuarioParaEditar ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
