import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserX,
  Layers,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useAccess } from '@/lib/data/AccessContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function Index() {
  const { usuarios, sistemas, perfis } = useAccess()

  const usuariosAtivos = usuarios.filter((u) => u.ativo)
  const usuariosInativos = usuarios.filter((u) => !u.ativo)
  const sistemasAtivos = sistemas.filter((s) => s.ativo)

  // Dados para o gráfico de barras flex customizado
  const barColors: Record<string, { bg: string; text: string; bar: string }> = {
    CONECTAI: { bg: 'bg-teal-50', text: 'text-[#0E7C7B]', bar: 'bg-[#0E7C7B]' },
    RICCI_TASK: { bg: 'bg-blue-50', text: 'text-[#1B4E8C]', bar: 'bg-[#1B4E8C]' },
    PRISMA: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
    MANYSKIP: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  }

  const maxUsuarios = Math.max(...sistemas.map((s) => s.totalUsuariosAcesso), 1)

  // 5 usuários mais recentes
  const ultimosUsuarios = [...usuarios]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-8">
      {/* Alerta de Diretriz Corporativa */}
      <div className="bg-gradient-to-r from-blue-900/90 to-[#1B4E8C] text-white p-4 rounded-xl shadow-sm border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/10 shrink-0">
            <ShieldAlert className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="font-semibold text-sm">
              Gestor de Acesso Centralizado • Ecossistema Ricci
            </div>
            <p className="text-xs text-blue-100 mt-0.5 max-w-3xl leading-relaxed">
              Aplicação corporativa independente. Regra de segurança global: o status do usuário no
              cadastro central prevalece sobre qualquer sistema. Usuário inativo tem acesso
              bloqueado universalmente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Políticas Centrais Ativas</span>
        </div>
      </div>

      {/* Row de Estatísticas */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Usuários Ativos */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Usuários Ativos
              </CardTitle>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {usuariosAtivos.length}
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Com credencial corporativa ativa
              </p>
            </CardContent>
          </Card>

          {/* Card Usuários Inativos */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Usuários Inativos
              </CardTitle>
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {usuariosInativos.length}
              </div>
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Bloqueados em todos os sistemas
              </p>
            </CardContent>
          </Card>

          {/* Card Sistemas */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sistemas Cadastrados
              </CardTitle>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1B4E8C] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {sistemas.length}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                <span className="font-semibold text-emerald-600">
                  {sistemasAtivos.length} ativos
                </span>
                {' • '}
                <span className="text-slate-400">
                  {sistemas.length - sistemasAtivos.length} previstos
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Card Perfis */}
          <Card className="border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Perfis Parametrizados
              </CardTitle>
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {perfis.length}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Distribuídos entre os sistemas
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Grid: Sistemas e Gráfico de Acessos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Seção de Sistemas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sistemas da Corporação</h2>
              <p className="text-xs text-slate-500">
                Sistemas com autenticação e permissões governadas pelo Gestor
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs text-[#1B4E8C] hover:text-[#163F73]"
            >
              <Link to="/sistemas">
                Ver todos <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sistemas.map((sistema) => {
              const colorConfig = barColors[sistema.codigo] || {
                bg: 'bg-slate-50',
                text: 'text-slate-700',
                bar: 'bg-slate-600',
              }

              return (
                <div
                  key={sistema.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-[#1B4E8C]/30 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {sistema.codigo}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            sistema.ativo ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-[11px] font-medium text-slate-600">
                          {sistema.ativo ? 'Ativo' : 'Inativo / Futuro'}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">{sistema.nome}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {sistema.descricao}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Usuários com acesso:</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-semibold ${colorConfig.bg} ${colorConfig.text} border-0`}
                    >
                      {sistema.totalUsuariosAcesso} ativos
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gráfico de Barras: Acessos por Sistema */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Acessos por Sistema</h2>
              <p className="text-xs text-slate-500">Contagem de usuários ativos com permissão</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <Card className="border border-slate-200 bg-white p-5 shadow-xs">
            <div className="space-y-5">
              {sistemas.map((sistema) => {
                const count = sistema.totalUsuariosAcesso
                const percentage = Math.round((count / maxUsuarios) * 100)
                const colorConfig = barColors[sistema.codigo] || {
                  bg: 'bg-slate-50',
                  text: 'text-slate-700',
                  bar: 'bg-slate-600',
                }

                return (
                  <div key={sistema.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 flex items-center gap-2">
                        <span>{sistema.nome}</span>
                        {!sistema.ativo && (
                          <span className="text-[10px] text-slate-400 font-normal">(previsto)</span>
                        )}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {count} {count === 1 ? 'usuário' : 'usuários'}
                      </span>
                    </div>

                    {/* Barra customizada animada */}
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          sistema.ativo ? colorConfig.bar : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0E7C7B]" />
                <span>Conectaí</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1B4E8C]" />
                <span>Ricci Task</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
                <span>Futuros</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Seção: Últimos Usuários */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Últimos Usuários Cadastrados</h2>
            <p className="text-xs text-slate-500">
              Visão rápida dos registros centrais mais recentes
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="text-xs">
            <Link to="/usuarios">
              Gerenciar todos <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Gestor Imediato</th>
                  <th className="py-3 px-4">Status Central</th>
                  <th className="py-3 px-4">Sistemas Atribuídos</th>
                  <th className="py-3 px-4 text-right">Data de Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {ultimosUsuarios.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 bg-[#1B4E8C] text-white">
                            <AvatarFallback className="bg-[#1B4E8C] text-white text-xs font-medium">
                              {getInitials(u.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {u.nome}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {u.gestorNome ? (
                          <span className="font-medium text-slate-800">{u.gestorNome}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.ativo ? (
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
                      <td className="py-3.5 px-4">
                        {!u.ativo ? (
                          <span className="text-xs text-slate-400 italic">
                            Sem acesso (usuário inativo)
                          </span>
                        ) : u.sistemasAcesso.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {u.sistemasAcesso.map((ac) => (
                              <Badge
                                key={ac.sistemaId}
                                variant="outline"
                                className="text-[11px] bg-slate-50 text-slate-700 border-slate-200"
                              >
                                {ac.sistemaNome} ({ac.perfilNome})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Nenhum sistema</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
