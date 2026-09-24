// Repositório em memória pré-populado com dados de exemplo corporativos claramente marcados como dados de demonstração.
// AVISO IMPORTANTE: Substituir esta camada de mock por queries reais do Supabase (REST/PostgREST) quando as tabelas centrais forem criadas no banco de dados.

import type { CoreUsuario, CoreSistema, CoreUsuarioSistema, CorePerfil } from './types'

export const INITIAL_SISTEMAS: CoreSistema[] = [
  {
    id: 'sis-1',
    codigo: 'CONECTAI',
    nome: 'Conectaí',
    descricao:
      'Plataforma integrada de comunicação corporativa, atendimento e relacionamento com clientes Ricci.',
    ativo: true,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z',
  },
  {
    id: 'sis-2',
    codigo: 'RICCI_TASK',
    nome: 'Ricci Task',
    descricao:
      'Sistema corporativo de gestão de tarefas, prazos processuais e produtividade das equipes internas.',
    ativo: true,
    created_at: '2024-01-15T08:30:00Z',
    updated_at: '2024-01-15T08:30:00Z',
  },
  {
    id: 'sis-3',
    codigo: 'PRISMA',
    nome: 'Prisma BI & Analytics',
    descricao:
      'Módulo avançado de inteligência jurídica, análise preditiva de acórdãos e dashboards de performance financeira.',
    ativo: false, // Exemplo futuro inativo conforme especificação
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'sis-4',
    codigo: 'MANYSKIP',
    nome: 'ManySkip Orchestrator',
    descricao:
      'Plataforma corporativa de automação de fluxos conversacionais omnichannel e integrações avançadas.',
    ativo: false, // Exemplo futuro inativo conforme especificação
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  },
]

export const INITIAL_PERFIS: CorePerfil[] = [
  // Conectaí
  {
    id: 'perf-1',
    sistema_id: 'sis-1',
    codigo: 'ADMIN',
    nome: 'Administrador Conectaí',
    descricao:
      'Acesso pleno à parametrização de canais, templates, logs e configurações globais de comunicação.',
    ativo: true,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'perf-2',
    sistema_id: 'sis-1',
    codigo: 'GESTOR',
    nome: 'Gestor de Atendimento',
    descricao:
      'Supervisão de filas de atendimento, distribuição de conversas, aprovações e relatórios operacionais.',
    ativo: true,
    created_at: '2024-01-15T09:10:00Z',
    updated_at: '2024-01-15T09:10:00Z',
  },
  {
    id: 'perf-3',
    sistema_id: 'sis-1',
    codigo: 'OPERACIONAL',
    nome: 'Operador / Atendente',
    descricao:
      'Interação direta com clientes, envio e resposta de mensagens, criação de chamados e histórico.',
    ativo: true,
    created_at: '2024-01-15T09:20:00Z',
    updated_at: '2024-01-15T09:20:00Z',
  },
  {
    id: 'perf-4',
    sistema_id: 'sis-1',
    codigo: 'AUDITOR',
    nome: 'Auditoria e Compliance',
    descricao: 'Visualização somente leitura de logs de atendimento e conformidade LGPD/segurança.',
    ativo: true,
    created_at: '2024-01-15T09:30:00Z',
    updated_at: '2024-01-15T09:30:00Z',
  },

  // Ricci Task
  {
    id: 'perf-5',
    sistema_id: 'sis-2',
    codigo: 'ADMIN',
    nome: 'Administrador Ricci Task',
    descricao:
      'Gestão completa de fluxos de tarefas, tipos de processo, esteiras de automação e permissões.',
    ativo: true,
    created_at: '2024-01-15T09:35:00Z',
    updated_at: '2024-01-15T09:35:00Z',
  },
  {
    id: 'perf-6',
    sistema_id: 'sis-2',
    codigo: 'GESTOR',
    nome: 'Gestor de Equipe',
    descricao:
      'Distribuição de tarefas entre colaboradores, monitoramento de prazos fatais e aprovação de entregas.',
    ativo: true,
    created_at: '2024-01-15T09:40:00Z',
    updated_at: '2024-01-15T09:40:00Z',
  },
  {
    id: 'perf-7',
    sistema_id: 'sis-2',
    codigo: 'OPERACIONAL',
    nome: 'Executor de Tarefas',
    descricao:
      'Execução de tarefas atribuídas, movimentação de status, apontamento de horas e anexação de peças.',
    ativo: true,
    created_at: '2024-01-15T09:45:00Z',
    updated_at: '2024-01-15T09:45:00Z',
  },

  // Prisma (inativo)
  {
    id: 'perf-8',
    sistema_id: 'sis-3',
    codigo: 'ANALISTA_BI',
    nome: 'Analista de BI',
    descricao: 'Construção de relatórios analíticos, modelos preditivos e dashboards executivos.',
    ativo: false,
    created_at: '2024-06-01T10:15:00Z',
    updated_at: '2024-06-01T10:15:00Z',
  },
  {
    id: 'perf-9',
    sistema_id: 'sis-3',
    codigo: 'LEITOR_EXECUTIVO',
    nome: 'Leitor Executivo',
    descricao: 'Visualização dos relatórios corporativos consolidados.',
    ativo: false,
    created_at: '2024-06-01T10:20:00Z',
    updated_at: '2024-06-01T10:20:00Z',
  },

  // ManySkip (inativo)
  {
    id: 'perf-10',
    sistema_id: 'sis-4',
    codigo: 'INTEGRADOR',
    nome: 'Integrador de Sistemas',
    descricao: 'Configuração de webhooks, pipelines de integração e credenciais de bots.',
    ativo: false,
    created_at: '2024-06-01T10:30:00Z',
    updated_at: '2024-06-01T10:30:00Z',
  },
]

export const INITIAL_USUARIOS: CoreUsuario[] = [
  {
    id: 'usr-1',
    auth_user_id: 'auth-001',
    nome: 'Antônio Ricci',
    email: 'antonio.ricci@riccipi.com.br',
    ativo: true,
    gestor_id: null,
    legaldesk_usuario_id: 'LD-001',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'usr-2',
    auth_user_id: 'auth-002',
    nome: 'Ana Carolina Valente',
    email: 'ana.valente@riccipi.com.br',
    ativo: true,
    gestor_id: 'usr-1',
    legaldesk_usuario_id: 'LD-042',
    created_at: '2024-01-12T11:20:00Z',
    updated_at: '2024-01-12T11:20:00Z',
  },
  {
    id: 'usr-3',
    auth_user_id: 'auth-003',
    nome: 'Carlos Eduardo Mendes',
    email: 'carlos.mendes@riccipi.com.br',
    ativo: true,
    gestor_id: 'usr-1',
    legaldesk_usuario_id: 'LD-089',
    created_at: '2024-01-18T14:15:00Z',
    updated_at: '2024-01-18T14:15:00Z',
  },
  {
    id: 'usr-4',
    auth_user_id: 'auth-004',
    nome: 'Mariana Duarte Ramos',
    email: 'mariana.duarte@riccipi.com.br',
    ativo: true,
    gestor_id: 'usr-2',
    legaldesk_usuario_id: 'LD-104',
    created_at: '2024-02-01T09:30:00Z',
    updated_at: '2024-02-01T09:30:00Z',
  },
  {
    id: 'usr-5',
    auth_user_id: 'auth-005',
    nome: 'Rodrigo Pires Barbosa',
    email: 'rodrigo.pires@riccipi.com.br',
    ativo: true,
    gestor_id: 'usr-3',
    legaldesk_usuario_id: null,
    created_at: '2024-02-15T16:00:00Z',
    updated_at: '2024-02-15T16:00:00Z',
  },
  {
    id: 'usr-6',
    auth_user_id: 'auth-006',
    nome: 'Fernanda Albuquerque',
    email: 'fernanda.albuquerque@riccipi.com.br',
    ativo: false, // Usuário inativo de exemplo (desligado)
    gestor_id: 'usr-1',
    legaldesk_usuario_id: 'LD-015',
    created_at: '2024-01-11T09:00:00Z',
    updated_at: '2024-03-01T18:00:00Z',
  },
  {
    id: 'usr-7',
    auth_user_id: 'auth-007',
    nome: 'Lucas Gabriel Silveira',
    email: 'lucas.silveira@riccipi.com.br',
    ativo: true,
    gestor_id: 'usr-2',
    legaldesk_usuario_id: 'LD-112',
    created_at: '2024-03-10T10:45:00Z',
    updated_at: '2024-03-10T10:45:00Z',
  },
  {
    id: 'usr-8',
    auth_user_id: 'auth-008',
    nome: 'Juliana Castro Martins',
    email: 'juliana.martins@riccipi.com.br',
    ativo: true,
    gestor_id: 'usr-3',
    legaldesk_usuario_id: null,
    created_at: '2024-03-22T13:10:00Z',
    updated_at: '2024-03-22T13:10:00Z',
  },
]

export const INITIAL_USUARIO_SISTEMAS: CoreUsuarioSistema[] = [
  // Antônio Ricci - Admin Conectaí e Admin Ricci Task
  {
    id: 'us-1',
    usuario_id: 'usr-1',
    sistema_id: 'sis-1',
    ativo: true,
    perfil_id: 'perf-1', // Admin Conectaí
    created_at: '2024-01-10T10:05:00Z',
    updated_at: '2024-01-10T10:05:00Z',
  },
  {
    id: 'us-2',
    usuario_id: 'usr-1',
    sistema_id: 'sis-2',
    ativo: true,
    perfil_id: 'perf-5', // Admin Ricci Task
    created_at: '2024-01-10T10:05:00Z',
    updated_at: '2024-01-10T10:05:00Z',
  },

  // Ana Carolina - Conectaí Operacional, Ricci Task Gestor (demonstra perfis diferentes por sistema)
  {
    id: 'us-3',
    usuario_id: 'usr-2',
    sistema_id: 'sis-1',
    ativo: true,
    perfil_id: 'perf-3', // Operacional Conectaí
    created_at: '2024-01-12T11:25:00Z',
    updated_at: '2024-01-12T11:25:00Z',
  },
  {
    id: 'us-4',
    usuario_id: 'usr-2',
    sistema_id: 'sis-2',
    ativo: true,
    perfil_id: 'perf-6', // Gestor Ricci Task
    created_at: '2024-01-12T11:25:00Z',
    updated_at: '2024-01-12T11:25:00Z',
  },

  // Carlos Eduardo - Gestor Conectaí, Operacional Ricci Task
  {
    id: 'us-5',
    usuario_id: 'usr-3',
    sistema_id: 'sis-1',
    ativo: true,
    perfil_id: 'perf-2', // Gestor Conectaí
    created_at: '2024-01-18T14:20:00Z',
    updated_at: '2024-01-18T14:20:00Z',
  },
  {
    id: 'us-6',
    usuario_id: 'usr-3',
    sistema_id: 'sis-2',
    ativo: true,
    perfil_id: 'perf-7', // Operacional Ricci Task
    created_at: '2024-01-18T14:20:00Z',
    updated_at: '2024-01-18T14:20:00Z',
  },

  // Mariana Duarte - Operador Conectaí
  {
    id: 'us-7',
    usuario_id: 'usr-4',
    sistema_id: 'sis-1',
    ativo: true,
    perfil_id: 'perf-3',
    created_at: '2024-02-01T09:35:00Z',
    updated_at: '2024-02-01T09:35:00Z',
  },

  // Rodrigo Pires - Operacional Ricci Task
  {
    id: 'us-8',
    usuario_id: 'usr-5',
    sistema_id: 'sis-2',
    ativo: true,
    perfil_id: 'perf-7',
    created_at: '2024-02-15T16:05:00Z',
    updated_at: '2024-02-15T16:05:00Z',
  },

  // Fernanda Albuquerque - Ex-usuária (inativa globalmente, manteve registros históricos para auditoria)
  {
    id: 'us-9',
    usuario_id: 'usr-6',
    sistema_id: 'sis-1',
    ativo: true, // na junção continua registrado, mas usuario.ativo=false bloqueia acesso global
    perfil_id: 'perf-3',
    created_at: '2024-01-11T09:05:00Z',
    updated_at: '2024-01-11T09:05:00Z',
  },
  {
    id: 'us-10',
    usuario_id: 'usr-6',
    sistema_id: 'sis-2',
    ativo: true,
    perfil_id: 'perf-7',
    created_at: '2024-01-11T09:05:00Z',
    updated_at: '2024-01-11T09:05:00Z',
  },

  // Lucas Gabriel - Operacional Conectaí e Operacional Ricci Task
  {
    id: 'us-11',
    usuario_id: 'usr-7',
    sistema_id: 'sis-1',
    ativo: true,
    perfil_id: 'perf-3',
    created_at: '2024-03-10T10:50:00Z',
    updated_at: '2024-03-10T10:50:00Z',
  },
  {
    id: 'us-12',
    usuario_id: 'usr-7',
    sistema_id: 'sis-2',
    ativo: true,
    perfil_id: 'perf-7',
    created_at: '2024-03-10T10:50:00Z',
    updated_at: '2024-03-10T10:50:00Z',
  },

  // Juliana Castro - Auditoria Conectaí
  {
    id: 'us-13',
    usuario_id: 'usr-8',
    sistema_id: 'sis-1',
    ativo: true,
    perfil_id: 'perf-4',
    created_at: '2024-03-22T13:15:00Z',
    updated_at: '2024-03-22T13:15:00Z',
  },
]
