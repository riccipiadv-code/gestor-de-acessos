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
import { AlertCircle, Check } from 'lucide-react'
import type { SistemaComEstatisticas } from '@/lib/data/types'

interface SistemaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sistemaParaEditar: SistemaComEstatisticas | null
  onSave: (dados: { codigo: string; nome: string; descricao: string; ativo: boolean }) => void
}

export function SistemaModal({ open, onOpenChange, sistemaParaEditar, onSave }: SistemaModalProps) {
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [errors, setErrors] = useState<{ codigo?: string; nome?: string }>({})

  useEffect(() => {
    if (!open) return

    if (sistemaParaEditar) {
      setCodigo(sistemaParaEditar.codigo)
      setNome(sistemaParaEditar.nome)
      setDescricao(sistemaParaEditar.descricao)
      setAtivo(sistemaParaEditar.ativo)
    } else {
      setCodigo('')
      setNome('')
      setDescricao('')
      setAtivo(true)
    }
    setErrors({})
  }, [open, sistemaParaEditar])

  const validate = (): boolean => {
    const errs: { codigo?: string; nome?: string } = {}
    if (!codigo.trim()) {
      errs.codigo = 'Código é obrigatório'
    }
    if (!nome.trim()) {
      errs.nome = 'Nome do sistema é obrigatório'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    onSave({
      codigo,
      nome,
      descricao,
      ativo,
    })

    onOpenChange(false)
  }

  const isEditing = Boolean(sistemaParaEditar)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white p-6 rounded-xl border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-base font-bold text-slate-900">
            {isEditing ? 'Editar Sistema' : 'Novo Sistema Corporativo'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isEditing
              ? 'Atualize as informações do sistema registrado. O código é imutável após a criação.'
              : 'Registre um novo sistema no catálogo central de acessos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Código */}
          <div className="space-y-1.5">
            <Label htmlFor="sis-codigo" className="text-xs font-semibold text-slate-700">
              Código Único do Sistema <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sis-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex.: CONECTAI, RICCI_TASK, PRISMA"
              disabled={isEditing}
              className={`font-mono text-xs uppercase ${
                isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
              } ${errors.codigo ? 'border-red-500' : ''}`}
            />
            {isEditing ? (
              <p className="text-[11px] text-slate-400">
                O código identifica a aplicação nas integrações e não pode ser alterado.
              </p>
            ) : errors.codigo ? (
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.codigo}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Utilize maiúsculas sem espaços (ex.: CONECTAI)
              </p>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="sis-nome" className="text-xs font-semibold text-slate-700">
              Nome Amigável <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sis-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Conectaí"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && (
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.nome}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="sis-desc" className="text-xs font-semibold text-slate-700">
              Descrição
            </Label>
            <Textarea
              id="sis-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Finalidade do sistema, público-alvo ou escopo corporativo..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <Label htmlFor="sis-ativo" className="text-xs font-bold text-slate-800 block">
                Status do Sistema
              </Label>
              <span className="text-[11px] text-slate-500">
                Sistemas inativos não permitem login ou emissão de permissões operacionais
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${ativo ? 'text-emerald-700' : 'text-slate-500'}`}
              >
                {ativo ? 'Ativo' : 'Inativo'}
              </span>
              <Switch id="sis-ativo" checked={ativo} onCheckedChange={setAtivo} />
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
              {isEditing ? 'Salvar Alterações' : 'Criar Sistema'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
