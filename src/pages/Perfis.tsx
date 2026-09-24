import React, { useState } from 'react'
import {
  ShieldCheck,
  Plus,
  Edit2,
  Power,
  Users,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  AlertCircle,
} from 'lucide-react'
import { useAccess } from '@/lib/data/AccessContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { PerfilModal } from '@/components/PerfilModal'
import type { PerfilComEstatisticas } from '@/lib/data/types'

export default function PerfisPage() {
  const { perfis, sistemas, createPerfil, updatePerfil, togglePerfilAtivo } = useAccess()
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [perfilEmEdicao, setPerfilEmEdicao] = useState<PerfilComEstatisticas | null>(null)
  const [sistemaPreSelecionadoId, setSistemaPreSelecionadoId] = useState<string | undefined>(
    undefined,
  )

  // Controle de colapso das seções por sistema (por padrão todas abertas)
  const [secoesAbertas, setSecoesAbertas] = useState<Record<string, boolean>>({
    'sis-1': true,
    'sis-2': true,
    'sis-3': true,
    'sis-4': true,
  })

  const toggleSecao = (sistemaId: string) => {
    setSecoesAbertas((prev) => ({
      ...prev,
      [sistemaId]: !prev[sistemaId],
    }))
  }

  const handleOpenCriar = (sistemaId?: string) => {
    setPerfilEmEdicao(null)
    setSistemaPreSelecionadoId(sistemaId)
    setModalOpen(true)
  }

  const handleOpenEditar = (perfil: PerfilComEstatisticas) => {
    setPerfilEmEdicao(perfil)
    setSistemaPreSelecionadoId(perfil.sistema_id)
    setModalOpen(true)
  }

  const handleToggleStatus = (perfil: PerfilComEstatisticas) => {
    const novoStatus = togglePerfilAtivo(perfil.id)
    if (novoStatus) {
      toast({
        title: 'Perfil ativado',
        description: `O perfil "${perfil.nome}" foi ativado.`,
      })
    } else {
      toast({
        title: 'Perfil desativado',
        description: `O perfil "${perfil.nome}" foi desativado para novas atribuições.`,
        variant: 'destructive',
      })
    }
  }

  const handleSavePerfil = (dados: {
    sistema_id: string
    codigo: string
    nome: string
    descricao: string
    ativo: boolean
  }) => {
    if (perfilEmEdicao) {
      updatePerfil(perfilEmEdicao.id, {
        codigo: dados.codigo,
        nome: dados.nome,
        descricao: dados.descricao,
        ativo: dados.ativo,
      })
      toast({
        title: 'Perfil atualizado',
        description: `O perfil "${dados.nome}" foi salvo com sucesso.`,
      })
    } else {
      createPerfil(dados)
      toast({
        title: 'Perfil criado',
        description: `Novo perfil "${dados.nome}" cadastrado com sucesso.`,
      })
    }
  }

  // Ordena os sistemas: ativos primeiro, depois inativos
  const sistemasOrdenados = [...sistemas].sort((a, b) => {
    if (a.ativo === b.ativo) return a.nome.localeCompare(b.nome)
    return a.ativo ? -1 : 1
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Perfis de Acesso</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perfis de permissão categorizados e parametrizados por sistema corporativo
          </p>
        </div>
        <Button
          onClick={() => handleOpenCriar()}
          className="bg-[#1B4E8C] hover:bg-[#163F73] text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Perfil
        </Button>
      </div>

      {/* Nota Importante: Perfis pertencem a um sistema */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-[#1B4E8C] shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-semibold">Regra Estrutural de Perfis:</span> Perfis pertencem
          estritamente a um sistema. Um perfil com o mesmo nome em sistemas diferentes (ex.:
          "Gestor" no Conectaí vs. "Gestor" no Ricci Task) possui escopos, permissões e regras
          distintas no backend de cada sistema. O usuário não tem um perfil global.
        </div>
      </div>

      {/* Seções agrupadas por Sistema */}
      <div className="space-y-6">
        {sistemasOrdenados.map((sistema) => {
          const perfisDesteSistema = perfis.filter((p) => p.sistema_id === sistema.id)
          const isAberta = secoesAbertas[sistema.id] ?? true

          return (
            <div
              key={sistema.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
            >
              {/* Header da Seção do Sistema (Colapsável) */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4E8C] flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{sistema.nome}</h3>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {sistema.codigo}
                      </span>
                      {sistema.ativo ? (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-500"
                          title="Sistema Ativo"
                        />
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-slate-500 bg-slate-100 border-slate-300"
                        >
                          Sistema Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {sistema.descricao}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCriar(sistema.id)}
                    className="h-8 text-xs hidden sm:flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Perfil
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSecao(sistema.id)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                    title={isAberta ? 'Recolher seção' : 'Expandir seção'}
                  >
                    {isAberta ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Corpo da Seção: Grid de Cards de Perfis */}
              {isAberta && (
                <div className="p-4">
                  {perfisDesteSistema.length === 0 ? (
                    <div className="p-8 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">
                        Nenhum perfil cadastrado para este sistema.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleOpenCriar(sistema.id)}
                        className="text-xs text-[#1B4E8C] mt-1"
                      >
                        Cadastrar primeiro perfil
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {perfisDesteSistema.map((perfil) => {
                        return (
                          <div
                            key={perfil.id}
                            className={`p-4 rounded-lg border transition-all duration-150 flex flex-col justify-between ${
                              perfil.ativo
                                ? 'bg-white border-slate-200 hover:border-[#1B4E8C]/30 hover:shadow-xs'
                                : 'bg-slate-50/60 border-slate-200/60 opacity-80'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {perfil.codigo}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEditar(perfil)}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                    title="Editar perfil"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleStatus(perfil)}
                                    className={`h-7 w-7 p-0 ${
                                      perfil.ativo
                                        ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                        : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                    title={perfil.ativo ? 'Desativar perfil' : 'Ativar perfil'}
                                  >
                                    <Power className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              <h4 className="font-bold text-slate-900 text-sm mb-1">
                                {perfil.nome}
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                                {perfil.descricao}
                              </p>
                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  {perfil.totalUsuarios}{' '}
                                  {perfil.totalUsuarios === 1 ? 'usuário' : 'usuários'}
                                </span>
                              </div>

                              <div>
                                {perfil.ativo ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[10px] font-medium">
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200 text-[10px] font-medium">
                                    Inativo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Criar / Editar Perfil */}
      <PerfilModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        perfilParaEditar={perfilEmEdicao}
        sistemaPreSelecionadoId={sistemaPreSelecionadoId}
        sistemas={sistemas}
        onSave={handleSavePerfil}
      />
    </div>
  )
}
