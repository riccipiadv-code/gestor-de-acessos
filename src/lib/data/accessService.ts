// Camada de Serviços Abstrata — Gestor de Acesso Ricci
//
// AVISO DE ARQUITETURA:
// Substituir esta camada de mock por queries Supabase reais (ex.: supabase.from('core_usuarios')...)
// quando as tabelas centrais do schema public forem criadas no banco de dados.
//
// Regra de segurança fundamental:
// Usuário inativo (ativo = false) NÃO acessa nenhum sistema corporativo.
// O acesso efetivo sempre requer: usuario.ativo === true AND usuario_sistema.ativo === true AND sistema.ativo === true.

import {
  INITIAL_USUARIOS,
  INITIAL_SISTEMAS,
  INITIAL_PERFIS,
  INITIAL_USUARIO_SISTEMAS,
} from './mockData'
import type {
  CoreUsuario,
  CoreSistema,
  CorePerfil,
  CoreUsuarioSistema,
  UsuarioComDetalhes,
  SistemaComEstatisticas,
  PerfilComEstatisticas,
} from './types'

type Listener = () => void

class AccessStore {
  private usuarios: CoreUsuario[] = [...INITIAL_USUARIOS]
  private sistemas: CoreSistema[] = [...INITIAL_SISTEMAS]
  private perfis: CorePerfil[] = [...INITIAL_PERFIS]
  private usuarioSistemas: CoreUsuarioSistema[] = [...INITIAL_USUARIO_SISTEMAS]
  private listeners: Set<Listener> = new Set()

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener()
      } catch (err) {
        console.error('Erro no listener da AccessStore:', err)
      }
    })
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ===================== USUÁRIOS =====================

  public listUsuarios(): UsuarioComDetalhes[] {
    const usuariosMap = new Map(this.usuarios.map((u) => [u.id, u]))
    const sistemasMap = new Map(this.sistemas.map((s) => [s.id, s]))
    const perfisMap = new Map(this.perfis.map((p) => [p.id, p]))

    return this.usuarios.map((usuario) => {
      const gestor = usuario.gestor_id ? usuariosMap.get(usuario.gestor_id) : null

      const acessos = this.usuarioSistemas
        .filter((us) => us.usuario_id === usuario.id)
        .map((us) => {
          const sistema = sistemasMap.get(us.sistema_id)
          const perfil = perfisMap.get(us.perfil_id)
          const sistemaAtivo = sistema?.ativo ?? false
          // Regra de desligamento: se usuário inativo, não tem acesso efetivo a nenhum sistema
          const acessoEfetivo = usuario.ativo && us.ativo && sistemaAtivo

          return {
            sistemaId: us.sistema_id,
            sistemaCodigo: sistema?.codigo || 'N/D',
            sistemaNome: sistema?.nome || 'Sistema Desconhecido',
            perfilId: us.perfil_id,
            perfilNome: perfil?.nome || 'Perfil Não Definido',
            perfilCodigo: perfil?.codigo || 'N/D',
            ativo: us.ativo,
            acessoEfetivo,
          }
        })

      return {
        ...usuario,
        gestorNome: gestor ? gestor.nome : null,
        sistemasAcesso: acessos,
      }
    })
  }

  public getUsuarioById(id: string): UsuarioComDetalhes | null {
    const todos = this.listUsuarios()
    return todos.find((u) => u.id === id) || null
  }

  public createUsuario(data: {
    nome: string
    email: string
    ativo: boolean
    gestor_id: string | null
    legaldesk_usuario_id?: string | null
    sistemas: { sistema_id: string; perfil_id: string }[]
  }): CoreUsuario {
    const now = new Date().toISOString()
    const novoUsuario: CoreUsuario = {
      id: `usr-${Date.now()}`,
      auth_user_id: null, // Será preenchido na integração com Supabase auth.users
      nome: data.nome.trim(),
      email: data.email.trim().toLowerCase(),
      ativo: data.ativo,
      gestor_id: data.gestor_id || null,
      legaldesk_usuario_id: data.legaldesk_usuario_id ? data.legaldesk_usuario_id.trim() : null,
      created_at: now,
      updated_at: now,
    }

    this.usuarios.unshift(novoUsuario)

    // Cadastra vínculos de sistema com perfis
    data.sistemas.forEach((item, index) => {
      this.usuarioSistemas.push({
        id: `us-${Date.now()}-${index}`,
        usuario_id: novoUsuario.id,
        sistema_id: item.sistema_id,
        perfil_id: item.perfil_id,
        ativo: true,
        created_at: now,
        updated_at: now,
      })
    })

    this.notify()
    return novoUsuario
  }

  public updateUsuario(
    id: string,
    data: {
      nome: string
      email: string
      ativo: boolean
      gestor_id: string | null
      legaldesk_usuario_id?: string | null
      sistemas: { sistema_id: string; perfil_id: string }[]
    },
  ): CoreUsuario {
    const index = this.usuarios.findIndex((u) => u.id === id)
    if (index === -1) {
      throw new Error('Usuário não encontrado')
    }

    const now = new Date().toISOString()
    const usuarioAtualizado: CoreUsuario = {
      ...this.usuarios[index],
      nome: data.nome.trim(),
      email: data.email.trim().toLowerCase(),
      ativo: data.ativo,
      gestor_id: data.gestor_id || null,
      legaldesk_usuario_id: data.legaldesk_usuario_id ? data.legaldesk_usuario_id.trim() : null,
      updated_at: now,
    }

    this.usuarios[index] = usuarioAtualizado

    // Atualiza vínculos de sistemas (remove os existentes desse usuário e recria com os perfis atualizados)
    this.usuarioSistemas = this.usuarioSistemas.filter((us) => us.usuario_id !== id)
    data.sistemas.forEach((item, idx) => {
      this.usuarioSistemas.push({
        id: `us-${Date.now()}-${idx}`,
        usuario_id: id,
        sistema_id: item.sistema_id,
        perfil_id: item.perfil_id,
        ativo: true,
        created_at: now,
        updated_at: now,
      })
    })

    this.notify()
    return usuarioAtualizado
  }

  public toggleUsuarioAtivo(id: string): boolean {
    const index = this.usuarios.findIndex((u) => u.id === id)
    if (index === -1) return false

    const novoStatus = !this.usuarios[index].ativo
    this.usuarios[index] = {
      ...this.usuarios[index],
      ativo: novoStatus,
      updated_at: new Date().toISOString(),
    }

    this.notify()
    return novoStatus
  }

  // ===================== SISTEMAS =====================

  public listSistemas(): SistemaComEstatisticas[] {
    return this.sistemas.map((sistema) => {
      // Usuários que têm acesso a este sistema E estão ativos
      const usuariosComAcesso = this.usuarioSistemas.filter((us) => {
        if (us.sistema_id !== sistema.id || !us.ativo) return false
        const usuario = this.usuarios.find((u) => u.id === us.usuario_id)
        return usuario && usuario.ativo
      }).length

      const totalPerfis = this.perfis.filter((p) => p.sistema_id === sistema.id).length

      return {
        ...sistema,
        totalUsuariosAcesso: usuariosComAcesso,
        totalPerfis,
      }
    })
  }

  public createSistema(data: {
    codigo: string
    nome: string
    descricao: string
    ativo: boolean
  }): CoreSistema {
    const now = new Date().toISOString()
    const novoSistema: CoreSistema = {
      id: `sis-${Date.now()}`,
      codigo: data.codigo.trim().toUpperCase().replace(/\s+/g, '_'),
      nome: data.nome.trim(),
      descricao: data.descricao.trim(),
      ativo: data.ativo,
      created_at: now,
      updated_at: now,
    }

    this.sistemas.push(novoSistema)
    this.notify()
    return novoSistema
  }

  public updateSistema(
    id: string,
    data: {
      nome: string
      descricao: string
      ativo: boolean
    },
  ): CoreSistema {
    const index = this.sistemas.findIndex((s) => s.id === id)
    if (index === -1) throw new Error('Sistema não encontrado')

    const now = new Date().toISOString()
    this.sistemas[index] = {
      ...this.sistemas[index],
      nome: data.nome.trim(),
      descricao: data.descricao.trim(),
      ativo: data.ativo,
      updated_at: now,
    }

    this.notify()
    return this.sistemas[index]
  }

  public toggleSistemaAtivo(id: string): boolean {
    const index = this.sistemas.findIndex((s) => s.id === id)
    if (index === -1) return false

    const novoStatus = !this.sistemas[index].ativo
    this.sistemas[index] = {
      ...this.sistemas[index],
      ativo: novoStatus,
      updated_at: new Date().toISOString(),
    }

    this.notify()
    return novoStatus
  }

  // ===================== PERFIS =====================

  public listPerfis(): PerfilComEstatisticas[] {
    const sistemasMap = new Map(this.sistemas.map((s) => [s.id, s]))

    return this.perfis.map((perfil) => {
      const sistema = sistemasMap.get(perfil.sistema_id)
      // Contagem de usuários ativos atribuídos a este perfil
      const totalUsuarios = this.usuarioSistemas.filter((us) => {
        if (us.perfil_id !== perfil.id || !us.ativo) return false
        const usuario = this.usuarios.find((u) => u.id === us.usuario_id)
        return usuario && usuario.ativo
      }).length

      return {
        ...perfil,
        sistemaNome: sistema?.nome || 'Sistema Desconhecido',
        sistemaCodigo: sistema?.codigo || 'N/D',
        totalUsuarios,
      }
    })
  }

  public listPerfisPorSistema(sistemaId: string): CorePerfil[] {
    return this.perfis.filter((p) => p.sistema_id === sistemaId && p.ativo)
  }

  public createPerfil(data: {
    sistema_id: string
    codigo: string
    nome: string
    descricao: string
    ativo: boolean
  }): CorePerfil {
    const now = new Date().toISOString()
    const novoPerfil: CorePerfil = {
      id: `perf-${Date.now()}`,
      sistema_id: data.sistema_id,
      codigo: data.codigo.trim().toUpperCase().replace(/\s+/g, '_'),
      nome: data.nome.trim(),
      descricao: data.descricao.trim(),
      ativo: data.ativo,
      created_at: now,
      updated_at: now,
    }

    this.perfis.push(novoPerfil)
    this.notify()
    return novoPerfil
  }

  public updatePerfil(
    id: string,
    data: {
      codigo: string
      nome: string
      descricao: string
      ativo: boolean
    },
  ): CorePerfil {
    const index = this.perfis.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Perfil não encontrado')

    const now = new Date().toISOString()
    this.perfis[index] = {
      ...this.perfis[index],
      codigo: data.codigo.trim().toUpperCase().replace(/\s+/g, '_'),
      nome: data.nome.trim(),
      descricao: data.descricao.trim(),
      ativo: data.ativo,
      updated_at: now,
    }

    this.notify()
    return this.perfis[index]
  }

  public togglePerfilAtivo(id: string): boolean {
    const index = this.perfis.findIndex((p) => p.id === id)
    if (index === -1) return false

    const novoStatus = !this.perfis[index].ativo
    this.perfis[index] = {
      ...this.perfis[index],
      ativo: novoStatus,
      updated_at: new Date().toISOString(),
    }

    this.notify()
    return novoStatus
  }

  // ===================== ESTATÍSTICAS DASHBOARD =====================

  public getDashboardStats() {
    const usuariosAtivos = this.usuarios.filter((u) => u.ativo).length
    const usuariosInativos = this.usuarios.filter((u) => !u.ativo).length
    const totalSistemas = this.sistemas.length
    const totalPerfis = this.perfis.length

    // Gráfico de acessos ativos por sistema
    const acessosPorSistema = this.sistemas.map((sistema) => {
      const count = this.usuarioSistemas.filter((us) => {
        if (us.sistema_id !== sistema.id || !us.ativo) return false
        const usuario = this.usuarios.find((u) => u.id === us.usuario_id)
        return usuario && usuario.ativo
      }).length

      return {
        sistemaId: sistema.id,
        codigo: sistema.codigo,
        nome: sistema.nome,
        ativo: sistema.ativo,
        usuariosAtivos: count,
      }
    })

    const ultimosUsuarios = this.listUsuarios()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    return {
      usuariosAtivos,
      usuariosInativos,
      totalSistemas,
      totalPerfis,
      acessosPorSistema,
      ultimosUsuarios,
    }
  }
}

// Instância singleton da store
export const accessStore = new AccessStore()

// Funções de serviço públicas para consumo direto pelos componentes da UI
export const accessService = {
  // Usuários
  listUsuarios: () => accessStore.listUsuarios(),
  getUsuarioById: (id: string) => accessStore.getUsuarioById(id),
  createUsuario: (data: Parameters<AccessStore['createUsuario']>[0]) =>
    accessStore.createUsuario(data),
  updateUsuario: (id: string, data: Parameters<AccessStore['updateUsuario']>[1]) =>
    accessStore.updateUsuario(id, data),
  toggleUsuarioAtivo: (id: string) => accessStore.toggleUsuarioAtivo(id),

  // Sistemas
  listSistemas: () => accessStore.listSistemas(),
  createSistema: (data: Parameters<AccessStore['createSistema']>[0]) =>
    accessStore.createSistema(data),
  updateSistema: (id: string, data: Parameters<AccessStore['updateSistema']>[1]) =>
    accessStore.updateSistema(id, data),
  toggleSistemaAtivo: (id: string) => accessStore.toggleSistemaAtivo(id),

  // Perfis
  listPerfis: () => accessStore.listPerfis(),
  listPerfisPorSistema: (sistemaId: string) => accessStore.listPerfisPorSistema(sistemaId),
  createPerfil: (data: Parameters<AccessStore['createPerfil']>[0]) =>
    accessStore.createPerfil(data),
  updatePerfil: (id: string, data: Parameters<AccessStore['updatePerfil']>[1]) =>
    accessStore.updatePerfil(id, data),
  togglePerfilAtivo: (id: string) => accessStore.togglePerfilAtivo(id),

  // Dashboard
  getDashboardStats: () => accessStore.getDashboardStats(),

  // Assinatura de mudanças
  subscribe: (listener: Listener) => accessStore.subscribe(listener),
}
