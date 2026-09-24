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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Check, Info } from 'lucide-react'
import type { PerfilComEstatisticas, SistemaComEstatisticas } from '@/lib/data/types'

interface PerfilModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  perfilParaEditar: PerfilComEstatisticas | null
  sistemaPreSelecionadoId?: string
  sistemas: SistemaComEstatisticas[]
  onSave: (dados: {
    sistema_id: string
    codigo: string
    nome: string
    descricao: string
    ativo: boolean
  }) => void
}

export function PerfilModal({
  open,
  onOpenChange,
  perfilParaEditar,
  sistemaPreSelecionadoId,
  sistemas,
  onSave,
}: PerfilModalProps) {
  const [sistemaId, setSistemaId] = useState('')
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [autoSugerirCodigo, setAutoSugerirCodigo] = useState(true)
  const [errors, setErrors] = useState<{ sistema_id?: string; nome?: string; codigo?: string }>({})

  const isEditing = Boolean(perfilParaEditar)

  useEffect(() => {
    if (!open) return

    if (perfilParaEditar) {
      setSistemaId(perfilParaEditar.sistema_id)
      setNome(perfilParaEditar.nome)
      setCodigo(perfilParaEditar.codigo)
      setDescricao(perfilParaEditar.descricao)
      setAtivo(perfilParaEditar.ativo)
      setAutoSugerirCodigo(false)
    } else {
      setSistemaId(sistemaPreSelecionadoId || sistemas.find((s) => s.ativo)?.id || '')
      setNome('')
      setCodigo('')
      setDescricao('')
      setAtivo(true)
      setAutoSugerirCodigo(true)
    }
    setErrors({})
  }, [open, perfilParaEditar, sistemaPreSelecionadoId, sistemas])

  const handleNomeChange = (val: string) => {
    setNome(val)
    if (autoSugerirCodigo && !isEditing) {
      // Sugere código a partir do nome
      const sugerido = val
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      setCodigo(sugerido)
    }
  }

  const validate = (): boolean => {
    const errs: { sistema_id?: string; nome?: string; codigo?: string } = {}
    if (!sistemaId) {
      errs.sistema_id = 'Selecione o sistema pertencente'
    }
    if (!nome.trim()) {
      errs.nome = 'Nome do perfil é obrigatório'
    }
    if (!codigo.trim()) {
      errs.codigo = 'Código do perfil é obrigatório'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSave({
      sistema_id: sistemaId,
      codigo,
      nome,
      descricao,
      ativo,
    })

    onOpenChange(false)
  }

  const sistemaAtual = sistemas.find((s) => s.id === sistemaId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white p-6 rounded-xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-base font-bold text-slate-900">
            {isEditing ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Perfis pertencem exclusivamente a um sistema específico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Seleção de Sistema (somente leitura na edição) */}
          <div className="space-y-1.5">
            <Label htmlFor="perf-sistema" className="text-xs font-semibold text-slate-700">
              Sistema <span className="text-red-500">*</span>
            </Label>
            {isEditing ? (
              <Input
                value={`${sistemaAtual?.nome || ''} (${sistemaAtual?.codigo || ''})`}
                disabled
                className="bg-slate-100 text-slate-600 text-xs cursor-not-allowed"
              />
            ) : (
              <Select value={sistemaId} onValueChange={setSistemaId}>
                <SelectTrigger id="perf-sistema" className="text-xs">
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent>
                  {sistemas.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.nome} ({s.codigo}) {!s.ativo && '— [Inativo]'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.sistema_id && (
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.sistema_id}
              </p>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="perf-nome" className="text-xs font-semibold text-slate-700">
              Nome do Perfil <span className="text-red-500">*</span>
            </Label>
            <Input
              id="perf-nome"
              value={nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex.: Gestor de Operações"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && (
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.nome}
              </p>
            )}
          </div>

          {/* Código */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="perf-codigo" className="text-xs font-semibold text-slate-700">
                Código do Perfil <span className="text-red-500">*</span>
              </Label>
              {!isEditing && (
                <span className="text-[10px] text-slate-400">
                  {autoSugerirCodigo ? 'Auto-sugerido do nome' : 'Customizado'}
                </span>
              )}
            </div>
            <Input
              id="perf-codigo"
              value={codigo}
              onChange={(e) => {
                setAutoSugerirCodigo(false)
                setCodigo(e.target.value.toUpperCase().replace(/\s+/g, '_'))
              }}
              placeholder="Ex.: GESTOR_OP, OPERADOR"
              className={`font-mono text-xs uppercase ${errors.codigo ? 'border-red-500' : ''}`}
            />
            {errors.codigo ? (
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.codigo}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Código identificador utilizado pelo backend do sistema correspondente.
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="perf-desc" className="text-xs font-semibold text-slate-700">
              Descrição das Responsabilidades
            </Label>
            <Textarea
              id="perf-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o escopo e autorizações conferidas por este perfil..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <Label htmlFor="perf-ativo" className="text-xs font-bold text-slate-800 block">
                Status do Perfil
              </Label>
              <span className="text-[11px] text-slate-500">
                Perfis inativos não podem ser atribuídos a novos usuários
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${ativo ? 'text-emerald-700' : 'text-slate-500'}`}
              >
                {ativo ? 'Ativo' : 'Inativo'}
              </span>
              <Switch id="perf-ativo" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
              className="text-xs bg-[#1B4E8C] hover:bg-[#163F73] text-white"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
