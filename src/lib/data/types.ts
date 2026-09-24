// Tipos TypeScript correspondentes às tabelas centrais core_* do Supabase
// Não inventar tabelas, não referenciar profiles ou sistemas antigos.

export interface CoreUsuario {
  id: string
  auth_user_id: string | null
  nome: string
  email: string
  ativo: boolean
  gestor_id: string | null
  created_at: string
  updated_at: string
}

export interface CoreSistema {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CorePerfil {
  id: string
  sistema_id: string
  codigo: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CoreUsuarioSistema {
  id: string
  usuario_id: string
  sistema_id: string
  perfil_id: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// Modelos enriquecidos para exibição em tela
export interface UsuarioComDetalhes extends CoreUsuario {
  gestorNome?: string | null
  sistemasAcesso: {
    sistemaId: string
    sistemaCodigo: string
    sistemaNome: string
    perfilId: string
    perfilNome: string
    perfilCodigo: string
    ativo: boolean
    acessoEfetivo: boolean // false se usuario.ativo for false ou us.ativo for false
  }[]
}

export interface SistemaComEstatisticas extends CoreSistema {
  totalUsuariosAcesso: number
  totalPerfis: number
}

export interface PerfilComEstatisticas extends CorePerfil {
  sistemaNome: string
  sistemaCodigo: string
  totalUsuarios: number
}
