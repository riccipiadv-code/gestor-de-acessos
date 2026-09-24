import React, { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  Power,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { useAccess } from '@/lib/data/AccessContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { UserModal } from '@/components/UserModal'
import { ViewAccessModal } from '@/components/ViewAccessModal'
import type { UsuarioComDetalhes } from '@/lib/data/types'

export default function UsuariosPage() {
  const { usuarios, sistemas, perfis, toggleUsuarioAtivo, createUsuario, updateUsuario } =
    useAccess()
  const { toast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10

  // Modais
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false)
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioComDetalhes | null>(null)
  const [modalAcessoOpen, setModalAcessoOpen] = useState(false)
  const [usuarioVisualizado, setUsuarioVisualizado] = useState<UsuarioComDetalhes | null>(null)

  // Filtragem
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      // Filtro de status
      if (filtroStatus === 'ativos' && !usuario.ativo) return false
      if (filtroStatus === 'inativos' && usuario.ativo) return false

      // Busca por nome ou email
      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const bateuNome = usuario.nome.toLowerCase().includes(termo)
        const bateuEmail = usuario.email.toLowerCase().includes(termo)
        if (!bateuNome && !bateuEmail) return false
      }

      return true
    })
  }, [usuarios, busca, filtroStatus])

  // Paginação simples
  const totalPaginas = Math.ceil(usuariosFiltrados.length / itensPorPagina) || 1
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina
    return usuariosFiltrados.slice(inicio, inicio + itensPorPagina)
  }, [usuariosFiltrados, paginaAtual])

  const handleToggleStatus = (usuario: UsuarioComDetalhes) => {
    const novoStatus = toggleUsuarioAtivo(usuario.id)
    if (novoStatus) {
      toast({
        title: 'Usuário ativado',
        description: `${usuario.nome} agora possui acesso corporativo normal.`,
      })
    } else {
      toast({
        title: 'Usuário desativado',
        description: `${usuario.nome} teve todos os acessos bloqueados universalmente.`,
        variant: 'destructive',
      })
    }
  }

  const handleOpenCriar = () => {
    setUsuarioEmEdicao(null)
    setModalUsuarioOpen(true)
  }

  const handleOpenEditar = (usuario: UsuarioComDetalhes) => {
    setUsuarioEmEdicao(usuario)
    setModalUsuarioOpen(true)
  }

  const handleOpenVisualizar = (usuario: UsuarioComDetalhes) => {
    setUsuarioVisualizado(usuario)
    setModalAcessoOpen(true)
  }

  const handleSaveUsuario = (dados: Parameters<typeof createUsuario>[0]) => {
    if (usuarioEmEdicao) {
      updateUsuario(usuarioEmEdicao.id, dados)
      toast({
        title: 'Usuário atualizado com sucesso',
        description: 'Os dados cadastrais e permissões centrais foram salvos.',
      })
    } else {
      createUsuario(dados)
      toast({
        title: 'Usuário criado com sucesso',
        description: 'Novo usuário corporativo registrado no Gestor de Acesso.',
      })
    }
  }

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header da Tela com Subtítulo e Botão de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Cadastro de Usuários Corporativos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento centralizado de identidades, gestores e vínculos aos sistemas da
            organização
          </p>
        </div>
        <Button
          onClick={handleOpenCriar}
          className="bg-[#1B4E8C] hover:bg-[#163F73] text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Usuário
        </Button>
      </div>

      {/* Regra de Desativação Callout */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Diretriz de Segurança:</strong> Não há exclusão física de registros para
            preservar o histórico de auditoria. Usuários desligados devem ser{' '}
            <strong>desativados</strong>, bloqueando imediatamente o acesso a todos os sistemas.
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[11px] bg-amber-100/70 px-2 py-0.5 rounded text-amber-800">
          Soft Disable Rule
        </span>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Input de Busca */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPaginaAtual(1)
            }}
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9 text-xs"
          />
        </div>

        {/* Filtro por Status */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Filtrar status:
          </span>
          <Select
            value={filtroStatus}
            onValueChange={(val: 'todos' | 'ativos' | 'inativos') => {
              setFiltroStatus(val)
              setPaginaAtual(1)
            }}
          >
            <SelectTrigger className="w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-xs">
                Todos ({usuarios.length})
              </SelectItem>
              <SelectItem value="ativos" className="text-xs">
                Ativos ({usuarios.filter((u) => u.ativo).length})
              </SelectItem>
              <SelectItem value="inativos" className="text-xs">
                Inativos ({usuarios.filter((u) => !u.ativo).length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Usuários (Desktop) / Cards (Mobile) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {usuariosFiltrados.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Nenhum usuário encontrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {busca
                ? `Não encontramos registros correspondentes à busca "${busca}". Tente outro termo.`
                : 'Não há usuários cadastrados com o filtro selecionado.'}
            </p>
            {busca && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBusca('')}
                className="text-xs mt-2"
              >
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nome & E-mail</th>
                    <th className="py-3 px-4">Gestor Imediato</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Sistemas com Acesso</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {usuariosPaginados.map((usuario) => {
                    const totalSistemas = usuario.sistemasAcesso.length
                    const sistemasExibidos = usuario.sistemasAcesso.slice(0, 3)
                    const restante = totalSistemas - 3

                    return (
                      <tr
                        key={usuario.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          !usuario.ativo ? 'bg-slate-50/30' : ''
                        }`}
                      >
                        {/* Nome & Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 bg-[#1B4E8C] text-white">
                              <AvatarFallback className="bg-[#1B4E8C] text-white text-xs font-semibold">
                                {getInitials(usuario.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                                {usuario.nome}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {usuario.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Gestor */}
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {usuario.gestorNome ? (
                            <span className="font-medium text-slate-800">{usuario.gestorNome}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status Chip */}
                        <td className="py-3.5 px-4">
                          {usuario.ativo ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                              Inativo
                            </Badge>
                          )}
                        </td>

                        {/* Sistemas com acesso */}
                        <td className="py-3.5 px-4">
                          {!usuario.ativo ? (
                            <span className="text-xs text-slate-400 italic">
                              Sem acesso — usuário inativo
                            </span>
                          ) : totalSistemas > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {sistemasExibidos.map((sis) => (
                                <Badge
                                  key={sis.sistemaId}
                                  variant="outline"
                                  className="text-[11px] bg-slate-50 text-slate-700 border-slate-200"
                                >
                                  {sis.sistemaNome}
                                </Badge>
                              ))}
                              {restante > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-slate-200/80 text-slate-700 font-semibold"
                                >
                                  +{restante}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Nenhum sistema</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Visualizar acessos */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenVisualizar(usuario)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              title="Visualizar acessos e perfis"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Editar */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditar(usuario)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              title="Editar dados do usuário"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* Toggle Ativar / Desativar */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(usuario)}
                              className={`h-8 w-8 p-0 ${
                                usuario.ativo
                                  ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={
                                usuario.ativo
                                  ? 'Desativar usuário (bloqueia todos os acessos)'
                                  : 'Reativar usuário'
                              }
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Mostrando{' '}
                  <span className="font-semibold text-slate-800">
                    {(paginaAtual - 1) * itensPorPagina + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-semibold text-slate-800">
                    {Math.min(paginaAtual * itensPorPagina, usuariosFiltrados.length)}
                  </span>{' '}
                  de{' '}
                  <span className="font-semibold text-slate-800">{usuariosFiltrados.length}</span>{' '}
                  usuários
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterior
                  </Button>
                  <div className="px-2 font-medium text-slate-700">
                    {paginaAtual} / {totalPaginas}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual === totalPaginas}
                    onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                    className="h-7 px-2 text-xs"
                  >
                    Próxima <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modais */}
      <UserModal
        open={modalUsuarioOpen}
        onOpenChange={setModalUsuarioOpen}
        usuarioParaEditar={usuarioEmEdicao}
        todosUsuarios={usuarios}
        sistemas={sistemas}
        perfis={perfis}
        onSave={handleSaveUsuario}
      />

      <ViewAccessModal
        open={modalAcessoOpen}
        onOpenChange={setModalAcessoOpen}
        usuario={usuarioVisualizado}
      />
    </div>
  )
}
