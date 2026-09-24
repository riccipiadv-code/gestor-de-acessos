import React, { useState } from 'react'
import {
  Layers,
  Plus,
  Edit2,
  Power,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { useAccess } from '@/lib/data/AccessContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { SistemaModal } from '@/components/SistemaModal'
import type { SistemaComEstatisticas } from '@/lib/data/types'

export default function SistemasPage() {
  const { sistemas, createSistema, updateSistema, toggleSistemaAtivo } = useAccess()
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [sistemaEmEdicao, setSistemaEmEdicao] = useState<SistemaComEstatisticas | null>(null)

  const handleOpenCriar = () => {
    setSistemaEmEdicao(null)
    setModalOpen(true)
  }

  const handleOpenEditar = (sistema: SistemaComEstatisticas) => {
    setSistemaEmEdicao(sistema)
    setModalOpen(true)
  }

  const handleToggleStatus = (sistema: SistemaComEstatisticas) => {
    const novoStatus = toggleSistemaAtivo(sistema.id)
    if (novoStatus) {
      toast({
        title: 'Sistema ativado',
        description: `O sistema ${sistema.nome} agora está ativo e disponível para uso.`,
      })
    } else {
      toast({
        title: 'Sistema desativado',
        description: `O sistema ${sistema.nome} foi desativado. Usuários não conseguirão autenticar nele.`,
        variant: 'destructive',
      })
    }
  }

  const handleSaveSistema = (dados: {
    codigo: string
    nome: string
    descricao: string
    ativo: boolean
  }) => {
    if (sistemaEmEdicao) {
      updateSistema(sistemaEmEdicao.id, {
        nome: dados.nome,
        descricao: dados.descricao,
        ativo: dados.ativo,
      })
      toast({
        title: 'Sistema atualizado',
        description: `As informações do sistema ${dados.nome} foram salvas.`,
      })
    } else {
      createSistema(dados)
      toast({
        title: 'Sistema criado',
        description: `Novo sistema ${dados.nome} (${dados.codigo}) registrado no catálogo central.`,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sistemas Corporativos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistemas internos registrados na corporação Ricci com controle central de acesso
          </p>
        </div>
        <Button
          onClick={handleOpenCriar}
          className="bg-[#1B4E8C] hover:bg-[#163F73] text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Sistema
        </Button>
      </div>

      {/* Nota de Desacoplamento Corporativo */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-[#1B4E8C] shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-semibold">Catálogo Central Independente:</span> Conectaí e Ricci
          Task são os dois sistemas ativos hoje. Futuros módulos como Prisma BI e ManySkip estão
          modelados para demonstrar escalabilidade imediata do modelo corporativo sem afetar código
          legado.
        </div>
      </div>

      {/* Grid de Cards de Sistemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sistemas.map((sistema) => {
          return (
            <div
              key={sistema.id}
              className={`bg-white border rounded-xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between ${
                sistema.ativo
                  ? 'border-slate-200 hover:border-[#1B4E8C]/40 hover:shadow-md'
                  : 'border-slate-200/60 bg-slate-50/40 opacity-85'
              }`}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {sistema.codigo}
                    </span>
                    {sistema.ativo ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200 text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                        Inativo / Previsto
                      </Badge>
                    )}
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditar(sistema)}
                      className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      title="Editar sistema"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(sistema)}
                      className={`h-7 w-7 p-0 ${
                        sistema.ativo
                          ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={sistema.ativo ? 'Desativar sistema' : 'Ativar sistema'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Nome e Descrição */}
                <h3 className="text-base font-bold text-slate-900 mb-1">{sistema.nome}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{sistema.descricao}</p>
              </div>

              {/* Estatísticas do Sistema */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Users className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Usuários Ativos
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {sistema.totalUsuariosAcesso}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Perfis Criados
                    </div>
                    <div className="font-bold text-slate-800 text-sm">{sistema.totalPerfis}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Criar / Editar Sistema */}
      <SistemaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sistemaParaEditar={sistemaEmEdicao}
        onSave={handleSaveSistema}
      />
    </div>
  )
}
