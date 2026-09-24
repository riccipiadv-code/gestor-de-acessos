import { supabase } from '@/lib/supabase/client'
import type {
  CoreUsuario,
  CoreSistema,
  CorePerfil,
  CoreUsuarioSistema,
  UsuarioComDetalhes,
  SistemaComEstatisticas,
  PerfilComEstatisticas,
} from './types'

export interface CreateUserData {
  nome: string
  email: string
  ativo: boolean
  gestor_id: string | null
  sistemas: { sistema_id: string; perfil_id: string }[]
  send_invite?: boolean
}

export interface UpdateUserData {
  nome: string
  email: string
  ativo: boolean
  gestor_id: string | null
  sistemas: { sistema_id: string; perfil_id: string }[]
}

class CoreAccessService {
  /**
   * Busca completa dos dados diretamente das tabelas core_* com a sessão do usuário.
   * RLS ativo: core_usuarios_leitura_propria_ou_admin, core_sistemas_leitura_autenticado,
   * core_perfis_leitura_autenticado, core_usuario_sistemas_leitura_propria_ou_admin.
   */
  public async loadAll(): Promise<{
    usuarios: UsuarioComDetalhes[]
    sistemas: SistemaComEstatisticas[]
    perfis: PerfilComEstatisticas[]
    error?: string
  }> {
    try {
      // 1. Carrega sistemas
      const { data: sistemasData, error: sisErr } = await supabase
        .from('core_sistemas')
        .select('*')
        .order('nome', { ascending: true })

      if (sisErr) throw sisErr
      const sistemas = (sistemasData || []) as CoreSistema[]

      // 2. Carrega perfis
      const { data: perfisData, error: perfErr } = await supabase
        .from('core_perfis')
        .select('*')
        .order('nome', { ascending: true })

      if (perfErr) throw perfErr
      const perfis = (perfisData || []) as CorePerfil[]

      // 3. Carrega usuários
      const { data: usuariosData, error: userErr } = await supabase
        .from('core_usuarios')
        .select('*')
        .order('nome', { ascending: true })

      if (userErr) throw userErr
      const usuarios = (usuariosData || []) as CoreUsuario[]

      // 4. Carrega acessos de usuários
      const { data: usuarioSistemasData, error: usErr } = await supabase
        .from('core_usuario_sistemas')
        .select('*')

      if (usErr) throw usErr
      const usuarioSistemas = (usuarioSistemasData || []) as CoreUsuarioSistema[]

      // Mapeamento rápido
      const usuariosMap = new Map(usuarios.map((u) => [u.id, u]))
      const sistemasMap = new Map(sistemas.map((s) => [s.id, s]))
      const perfisMap = new Map(perfis.map((p) => [p.id, p]))

      // Usuários com detalhes (gestorNome e sistemasAcesso)
      const usuariosComDetalhes: UsuarioComDetalhes[] = usuarios.map((usuario) => {
        const gestor = usuario.gestor_id ? usuariosMap.get(usuario.gestor_id) : null

        const acessos = usuarioSistemas
          .filter((us) => us.usuario_id === usuario.id)
          .map((us) => {
            const sistema = sistemasMap.get(us.sistema_id)
            const perfil = perfisMap.get(us.perfil_id)
            const sistemaAtivo = sistema?.ativo ?? false
            // Regra corporativa: usuário inativo bloqueia acesso universalmente
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

      // Sistemas com estatísticas
      const sistemasComEstatisticas: SistemaComEstatisticas[] = sistemas.map((sistema) => {
        const totalUsuariosAcesso = usuarioSistemas.filter((us) => {
          if (us.sistema_id !== sistema.id || !us.ativo) return false
          const u = usuariosMap.get(us.usuario_id)
          return u && u.ativo
        }).length

        const totalPerfis = perfis.filter((p) => p.sistema_id === sistema.id).length

        return {
          ...sistema,
          totalUsuariosAcesso,
          totalPerfis,
        }
      })

      // Perfis com estatísticas
      const perfisComEstatisticas: PerfilComEstatisticas[] = perfis.map((perfil) => {
        const sis = sistemasMap.get(perfil.sistema_id)
        const totalUsuarios = usuarioSistemas.filter((us) => {
          if (us.perfil_id !== perfil.id || !us.ativo) return false
          const u = usuariosMap.get(us.usuario_id)
          return u && u.ativo
        }).length

        return {
          ...perfil,
          sistemaNome: sis?.nome || 'Sistema Desconhecido',
          sistemaCodigo: sis?.codigo || 'N/D',
          totalUsuarios,
        }
      })

      return {
        usuarios: usuariosComDetalhes,
        sistemas: sistemasComEstatisticas,
        perfis: perfisComEstatisticas,
      }
    } catch (err: unknown) {
      const error = err as Error
      console.error('Erro ao carregar dados do core:', error)
      return {
        usuarios: [],
        sistemas: [],
        perfis: [],
        error: error?.message || 'Erro ao carregar dados do banco.',
      }
    }
  }

  /**
   * Operações de escrita: TODAS chamam a Edge Function exclusiva `manage-core-user`
   */
  public async createUsuario(
    data: CreateUserData,
  ): Promise<{ success: boolean; error?: string; warning?: string }> {
    try {
      const { data: resData, error } = await supabase.functions.invoke('manage-core-user', {
        body: {
          action: 'create_user',
          nome: data.nome,
          email: data.email,
          ativo: data.ativo,
          gestor_id: data.gestor_id,
          sistemas: data.sistemas,
          send_invite: data.send_invite ?? true,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }
      if (resData?.error) {
        return { success: false, error: resData.error }
      }

      return {
        success: true,
        warning: resData?.invite_warning || undefined,
      }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error?.message || 'Falha ao cadastrar usuário.' }
    }
  }

  public async updateUsuario(
    id: string,
    data: UpdateUserData,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: resData, error } = await supabase.functions.invoke('manage-core-user', {
        body: {
          action: 'update_user',
          id,
          nome: data.nome,
          email: data.email,
          ativo: data.ativo,
          gestor_id: data.gestor_id,
          sistemas: data.sistemas,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }
      if (resData?.error) {
        return { success: false, error: resData.error }
      }

      return { success: true }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error?.message || 'Falha ao atualizar usuário.' }
    }
  }

  public async toggleUsuarioAtivo(
    id: string,
  ): Promise<{ success: boolean; error?: string; ativo?: boolean }> {
    try {
      const { data: resData, error } = await supabase.functions.invoke('manage-core-user', {
        body: {
          action: 'toggle_status',
          id,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }
      if (resData?.error) {
        return { success: false, error: resData.error }
      }

      return { success: true, ativo: resData.ativo }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error?.message || 'Falha ao alternar status do usuário.' }
    }
  }

  public async inviteOuResetSenha(
    id: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data: resData, error } = await supabase.functions.invoke('manage-core-user', {
        body: {
          action: 'invite_user',
          id,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }
      if (resData?.error) {
        return { success: false, error: resData.error }
      }

      return { success: true, message: resData.message || 'Operação realizada com sucesso.' }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error?.message || 'Falha ao disparar convite/recuperação.' }
    }
  }
}

export const coreAccessService = new CoreAccessService()
