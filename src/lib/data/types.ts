// Tipos TypeScript espelhando exatamente as futuras tabelas do schema public do Supabase
// Substituir esta camada por tipos gerados do Supabase quando as tabelas centrais forem criadas.

export interface CoreUsuario {
  id: string
  auth_user_id: string | null
  nome: string
  email: string
  ativo: boolean
  gestor_id: string | null
  legaldesk_usuario_id: string | null
  created_at: string
  updated_at: string
}

export interface CoreSistema {
  id: string
  codigo: string
  nome: string
  descricao: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CoreUsuarioSistema {
  id: string
  usuario_id: string
  sistema_id: string
  ativo: boolean
  perfil_id: string
  created_at: string
  updated_at: string
}

export interface CorePerfil {
  id: string
  sistema_id: string
  codigo: string
  nome: string
  descricao: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// Modelos enriquecidos para exibição em UI
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
    acessoEfetivo: boolean // false se usuario.ativo for false
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
