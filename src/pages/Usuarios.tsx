import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  Plus,
  Edit2,
  Power,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Eye,
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
import { ResetPasswordModal } from '@/components/ResetPasswordModal'
import type { UsuarioComDetalhes } from '@/lib/data/types'

export default function UsuariosPage() {
  const {
    usuarios,
    sistemas,
    perfis,
    loading,
    error,
    refresh,
    toggleUsuarioAtivo,
    createUsuario,
    updateUsuario,
  } = useAccess()
  const { toast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos')

  // Modais
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false)
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioComDetalhes | null>(null)

  const [modalAcessoOpen, setModalAcessoOpen] = useState(false)
  const [usuarioVisualizado, setUsuarioVisualizado] = useState<UsuarioComDetalhes | null>(null)

  const [modalResetSenhaOpen, setModalResetSenhaOpen] = useState(false)
  const [usuarioResetSenha, setUsuarioResetSenha] = useState<UsuarioComDetalhes | null>(null)

  // Filtragem: busca por Nome ou E-mail e filtro Ativo/Inativo
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      if (filtroStatus === 'ativos' && !usuario.ativo) return false
      if (filtroStatus === 'inativos' && usuario.ativo) return false

      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const bateuNome = usuario.nome.toLowerCase().includes(termo)
        const bateuEmail = usuario.email.toLowerCase().includes(termo)
        if (!bateuNome && !bateuEmail) return false
      }

      return true
    })
  }, [usuarios, busca, filtroStatus])

  const handleToggleStatus = async (usuario: UsuarioComDetalhes) => {
    // Validação preventiva no frontend: não desativar se for o único admin ativo de GESTOR_ACESSO
    if (usuario.ativo) {
      const isGestorAdmin = usuario.sistemasAcesso.some(
        (sa) =>
          sa.sistemaCodigo === 'GESTOR_ACESSO' && sa.perfilCodigo === 'ADMINISTRADOR' && sa.ativo,
      )

      if (isGestorAdmin) {
        const outrosAdminsAtivos = usuarios.filter(
          (u) =>
            u.id !== usuario.id &&
            u.ativo &&
            u.sistemasAcesso.some(
              (sa) =>
                sa.sistemaCodigo === 'GESTOR_ACESSO' &&
                sa.perfilCodigo === 'ADMINISTRADOR' &&
                sa.ativo,
            ),
        )

        if (outrosAdminsAtivos.length === 0) {
          toast({
            title: 'Operação bloqueada',
            description:
              'Não é permitido desativar o único Administrador ativo no sistema GESTOR_ACESSO.',
            variant: 'destructive',
          })
          return
        }
      }
    }

    const res = await toggleUsuarioAtivo(usuario.id)
    if (res.success) {
      if (res.ativo) {
        toast({
          title: 'Usuário ativado',
          description: `${usuario.nome} agora possui acesso corporativo normal.`,
        })
      } else {
        toast({
          title: 'Usuário desativado',
          description: `${usuario.nome} foi desativado. Todos os acessos aos sistemas foram bloqueados.`,
          variant: 'destructive',
        })
      }
    } else {
      toast({
        title: 'Erro ao alterar status',
        description: res.error || 'Falha ao atualizar o usuário.',
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

  const handleOpenGerenciarAcessos = (usuario: UsuarioComDetalhes) => {
    setUsuarioEmEdicao(usuario)
    setModalUsuarioOpen(true)
  }

  const handleOpenVisualizarAcessos = (usuario: UsuarioComDetalhes) => {
    setUsuarioVisualizado(usuario)
    setModalAcessoOpen(true)
  }

  const handleOpenResetSenha = (usuario: UsuarioComDetalhes) => {
    setUsuarioResetSenha(usuario)
    setModalResetSenhaOpen(true)
  }

  const handleSaveUsuario = async (dados: {
    nome: string
    email: string
    ativo: boolean
    gestor_id: string | null
    sistemas: { sistema_id: string; perfil_id: string }[]
    send_invite?: boolean
  }) => {
    if (usuarioEmEdicao) {
      const res = await updateUsuario(usuarioEmEdicao.id, dados)
      if (!res.success) {
        throw new Error(res.error || 'Erro ao atualizar usuário.')
      }
      toast({
        title: 'Usuário atualizado com sucesso',
        description: 'Os dados cadastrais e acessos aos sistemas foram salvos.',
      })
    } else {
      const res = await createUsuario(dados)
      if (!res.success) {
        throw new Error(res.error || 'Erro ao criar usuário.')
      }
      toast({
        title: 'Usuário cadastrado com sucesso',
        description: dados.send_invite
          ? 'Usuário criado e convite de acesso enviado por e-mail.'
          : 'Novo usuário registrado no Gestor de Acesso.',
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
      {/* Cabeçalho da Tela: Título, Descrição e Botão Novo Usuário */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administração central de identidades, status e perfis de acesso aos sistemas
            corporativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={loading}
            className="text-xs h-9"
            title="Atualizar lista"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={handleOpenCriar}
            className="bg-[#1B4E8C] hover:bg-[#163F73] text-white text-xs font-semibold shadow-xs h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Alerta de erro de carregamento se houver */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refresh()}
            className="text-xs text-red-900"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Regra de Desativação e Segurança */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Diretriz de Segurança:</strong> Não há exclusão física de registros para
            preservar o histórico de auditoria. Usuários desligados devem ser{' '}
            <strong>desativados</strong>, bloqueando imediatamente o acesso efetivo a todos os
            sistemas.
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[11px] bg-amber-100/70 px-2 py-0.5 rounded text-amber-800 shrink-0">
          Sem Exclusão Física
        </span>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Busca por Nome ou E-mail */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9 text-xs"
          />
        </div>

        {/* Filtro por Status Ativo / Inativo e Totalizador */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
            <Select
              value={filtroStatus}
              onValueChange={(val: 'todos' | 'ativos' | 'inativos') => {
                setFiltroStatus(val)
              }}
            >
              <SelectTrigger className="w-[160px] text-xs">
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

          <div className="text-xs text-slate-500 font-medium hidden sm:block pl-2 border-l border-slate-200">
            Total exibido: <strong className="text-slate-800">{usuariosFiltrados.length}</strong>
          </div>
        </div>
      </div>

      {/* Tabela Principal: Nome, E-mail, Gestor, Status, Acessos, Ações */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading && usuarios.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <RotateCw className="w-6 h-6 animate-spin text-[#1B4E8C] mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Carregando usuários corporativos...
            </p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Nenhum usuário encontrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {busca
                ? `Não encontramos registros correspondentes a "${busca}". Tente outro termo.`
                : 'Não há usuários cadastrados para o filtro selecionado.'}
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
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Gestor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Acessos</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {usuariosFiltrados.map((usuario) => {
                    const totalSistemas = usuario.sistemasAcesso.length

                    return (
                      <tr
                        key={usuario.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          !usuario.ativo ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        {/* Nome com Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 bg-[#1B4E8C] text-white">
                              <AvatarFallback className="bg-[#1B4E8C] text-white text-xs font-semibold">
                                {getInitials(usuario.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-slate-900 text-xs sm:text-sm block">
                                {usuario.nome}
                              </span>
                              {usuario.auth_user_id ? (
                                <span className="text-[10px] text-emerald-600 font-medium">
                                  Auth vinculado
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  Auth pendente
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* E-mail */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-600 font-mono">{usuario.email}</span>
                        </td>

                        {/* Gestor */}
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {usuario.gestorNome ? (
                            <span className="font-medium text-slate-800">{usuario.gestorNome}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status */}
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

                        {/* Acessos (Sistemas e Perfis vinculados) */}
                        <td className="py-3.5 px-4">
                          {!usuario.ativo ? (
                            <span className="text-xs text-slate-400 italic">
                              Acessos bloqueados (inativo)
                            </span>
                          ) : totalSistemas > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {usuario.sistemasAcesso.map((sis) => (
                                <Badge
                                  key={sis.sistemaId}
                                  variant="outline"
                                  className="text-[11px] bg-slate-50 text-slate-700 border-slate-200"
                                  title={`Perfil: ${sis.perfilNome}`}
                                >
                                  <span className="font-semibold text-slate-900 mr-1">
                                    {sis.sistemaNome}:
                                  </span>
                                  <span className="text-[#1B4E8C]">{sis.perfilNome}</span>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Nenhum acesso ativo</span>
                          )}
                        </td>

                        {/* Ações previstas */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Visualizar detalhes */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenVisualizarAcessos(usuario)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="Visualizar detalhes do usuário e acessos"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Gerenciar Acessos */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenGerenciarAcessos(usuario)}
                              className="h-8 px-2 text-xs text-[#1B4E8C] hover:text-[#163F73] hover:bg-blue-50"
                              title="Gerenciar acessos e perfis aos sistemas"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              <span className="hidden xl:inline">Acessos</span>
                            </Button>

                            {/* Editar dados cadastrais */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditar(usuario)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              title="Editar dados cadastrais e acessos"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* Ação de Senha (convite ou reset) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenResetSenha(usuario)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                              title={
                                usuario.auth_user_id
                                  ? 'Redefinir senha via Supabase Auth'
                                  : 'Enviar convite de primeiro acesso'
                              }
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>

                            {/* Ativar / Desativar */}
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

            {/* Barra informativa no rodapé da tabela (sem paginação, lista única completa) */}
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
              <div>
                Exibindo{' '}
                <span className="font-semibold text-slate-800">{usuariosFiltrados.length}</span> de{' '}
                <span className="font-semibold text-slate-800">{usuarios.length}</span> usuário(s)
                em lista única
              </div>
              <div className="text-[11px] text-slate-400">Todos os usuários filtrados visíveis</div>
            </div>
          </>
        )}
      </div>

      {/* Modal Único de Cadastro / Edição */}
      <UserModal
        open={modalUsuarioOpen}
        onOpenChange={setModalUsuarioOpen}
        usuarioParaEditar={usuarioEmEdicao}
        todosUsuarios={usuarios}
        sistemas={sistemas}
        perfis={perfis}
        onSave={handleSaveUsuario}
      />

      {/* Modal de Detalhes dos Acessos */}
      <ViewAccessModal
        open={modalAcessoOpen}
        onOpenChange={setModalAcessoOpen}
        usuario={usuarioVisualizado}
      />

      {/* Modal Administrativo de Senha / Convite */}
      <ResetPasswordModal
        open={modalResetSenhaOpen}
        onOpenChange={setModalResetSenhaOpen}
        usuario={usuarioResetSenha}
      />
    </div>
  )
}
