import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SistemaInput {
  sistema_id: string
  perfil_id: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Token de autorização não fornecido.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Configuração do servidor ausente.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Cliente administrativo com service_role (apenas interno na edge function, nunca exposto ao frontend)
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  try {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida ou expirada.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validação estrita da cadeia de administrador:
    // 1. core_usuarios pelo auth_user_id
    // 2. core_usuarios.ativo = true
    // 3. RPC core_is_gestor_acesso_admin() = true
    const { data: requesterCoreUser, error: coreUserError } = await adminClient
      .from('core_usuarios')
      .select('id, nome, email, ativo')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (coreUserError || !requesterCoreUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário corporativo não localizado em core_usuarios.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!requesterCoreUser.ativo) {
      return new Response(
        JSON.stringify({ error: 'Usuário corporativo inativo no Gestor de Acesso.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verifica se possui o perfil de ADMINISTRADOR no sistema GESTOR_ACESSO
    const { data: adminPerms, error: adminPermError } = await adminClient
      .from('core_usuario_sistemas')
      .select(`
        id,
        ativo,
        core_sistemas!inner(codigo, ativo),
        core_perfis!inner(codigo, ativo)
      `)
      .eq('usuario_id', requesterCoreUser.id)
      .eq('ativo', true)
      .eq('core_sistemas.codigo', 'GESTOR_ACESSO')
      .eq('core_sistemas.ativo', true)
      .eq('core_perfis.codigo', 'ADMINISTRADOR')
      .eq('core_perfis.ativo', true)

    if (adminPermError || !adminPerms || adminPerms.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            'Acesso negado: privilégios de administrador do Gestor de Acesso são obrigatórios.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Leitura do corpo da requisição
    const body = await req.json()
    const { action } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Parâmetro action ausente.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // =========================================================================
    // ACTION: create_user
    // Cria novo usuário corporativo em core_usuarios e seus acessos em core_usuario_sistemas
    // Opcionalmente dispara convite Supabase Auth caso send_invite = true
    // =========================================================================
    if (action === 'create_user') {
      const { nome, email, ativo, gestor_id, sistemas, send_invite } = body

      const normNome = String(nome || '').trim()
      const normEmail = String(email || '')
        .trim()
        .toLowerCase()
      const isAtivo = ativo ?? true

      if (!normNome || !normEmail) {
        return new Response(JSON.stringify({ error: 'Nome e e-mail são obrigatórios.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Validação de formato de e-mail básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normEmail)) {
        return new Response(JSON.stringify({ error: 'Formato de e-mail inválido.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verificar unicidade do e-mail em core_usuarios
      const { data: existingUser, error: checkEmailErr } = await adminClient
        .from('core_usuarios')
        .select('id')
        .ilike('email', normEmail)
        .maybeSingle()

      if (checkEmailErr) throw checkEmailErr
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Já existe um usuário cadastrado com este e-mail.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Validar gestor_id se fornecido
      let validatedGestorId: string | null = null
      if (gestor_id && typeof gestor_id === 'string' && gestor_id.trim()) {
        const { data: gestorData, error: gestorErr } = await adminClient
          .from('core_usuarios')
          .select('id, ativo')
          .eq('id', gestor_id.trim())
          .maybeSingle()

        if (gestorErr || !gestorData) {
          return new Response(JSON.stringify({ error: 'Gestor informado não encontrado.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        if (!gestorData.ativo) {
          return new Response(
            JSON.stringify({ error: 'O gestor selecionado precisa estar ativo.' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }
        validatedGestorId = gestorData.id
      }

      // Validar os acessos informados (sistema habilitado com perfil correspondente àquele sistema)
      const sanitizedSistemas: SistemaInput[] = []
      if (Array.isArray(sistemas)) {
        for (const item of sistemas) {
          if (!item.sistema_id || !item.perfil_id) continue

          // Checa se o perfil de fato pertence àquele sistema
          const { data: perfilCheck, error: pCheckErr } = await adminClient
            .from('core_perfis')
            .select('id, sistema_id, ativo')
            .eq('id', item.perfil_id)
            .eq('sistema_id', item.sistema_id)
            .maybeSingle()

          if (pCheckErr || !perfilCheck) {
            return new Response(
              JSON.stringify({
                error: `Perfil ${item.perfil_id} não pertence ao sistema ${item.sistema_id}.`,
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
          }

          sanitizedSistemas.push({
            sistema_id: item.sistema_id,
            perfil_id: item.perfil_id,
          })
        }
      }

      // Opcional: verificar se já existe em auth.users ou enviar convite
      let linkedAuthUserId: string | null = null
      const { data: authUsersList } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const existingAuth = (authUsersList?.users || []).find(
        (u) => u.email?.toLowerCase() === normEmail,
      )

      if (existingAuth) {
        linkedAuthUserId = existingAuth.id
      } else if (send_invite) {
        // Disparar convite de acesso pelo Supabase Auth
        const { data: inviteData, error: inviteErr } =
          await adminClient.auth.admin.inviteUserByEmail(normEmail, {
            data: { nome: normNome },
          })

        if (!inviteErr && inviteData?.user?.id) {
          linkedAuthUserId = inviteData.user.id
        }
      }

      // Inserir em core_usuarios
      const { data: newUsuario, error: insertUserErr } = await adminClient
        .from('core_usuarios')
        .insert({
          nome: normNome,
          email: normEmail,
          ativo: isAtivo,
          gestor_id: validatedGestorId,
          auth_user_id: linkedAuthUserId,
        })
        .select()
        .single()

      if (insertUserErr || !newUsuario) {
        throw insertUserErr || new Error('Falha ao inserir core_usuarios.')
      }

      // Inserir acessos em core_usuario_sistemas
      if (sanitizedSistemas.length > 0) {
        const acessosRows = sanitizedSistemas.map((item) => ({
          usuario_id: newUsuario.id,
          sistema_id: item.sistema_id,
          perfil_id: item.perfil_id,
          ativo: true,
        }))

        const { error: insertAcessosErr } = await adminClient
          .from('core_usuario_sistemas')
          .insert(acessosRows)

        if (insertAcessosErr) {
          console.error('Erro ao inserir acessos:', insertAcessosErr)
        }
      }

      return new Response(JSON.stringify({ success: true, usuario: newUsuario }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // =========================================================================
    // ACTION: update_user
    // Atualiza dados cadastrais, gestor e acessos em core_usuario_sistemas
    // =========================================================================
    if (action === 'update_user') {
      const { id, nome, email, ativo, gestor_id, sistemas } = body

      if (!id) {
        return new Response(JSON.stringify({ error: 'ID do usuário ausente.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const normNome = String(nome || '').trim()
      const normEmail = String(email || '')
        .trim()
        .toLowerCase()

      if (!normNome || !normEmail) {
        return new Response(JSON.stringify({ error: 'Nome e e-mail são obrigatórios.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Não permitir que o usuário seja gestor de si mesmo
      if (gestor_id && gestor_id === id) {
        return new Response(
          JSON.stringify({ error: 'O usuário não pode ser gestor de si mesmo.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Verificar unicidade de e-mail em outros registros
      const { data: existingEmailUser } = await adminClient
        .from('core_usuarios')
        .select('id')
        .ilike('email', normEmail)
        .neq('id', id)
        .maybeSingle()

      if (existingEmailUser) {
        return new Response(
          JSON.stringify({ error: 'Já existe outro usuário cadastrado com este e-mail.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Validar gestor_id se fornecido
      let validatedGestorId: string | null = null
      if (gestor_id && typeof gestor_id === 'string' && gestor_id.trim()) {
        const { data: gestorData, error: gestorErr } = await adminClient
          .from('core_usuarios')
          .select('id, ativo')
          .eq('id', gestor_id.trim())
          .maybeSingle()

        if (gestorErr || !gestorData) {
          return new Response(JSON.stringify({ error: 'Gestor informado não encontrado.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        if (!gestorData.ativo) {
          return new Response(
            JSON.stringify({ error: 'O gestor selecionado precisa estar ativo.' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }
        validatedGestorId = gestorData.id
      }

      // Atualizar core_usuarios
      const { data: updatedUser, error: updateErr } = await adminClient
        .from('core_usuarios')
        .update({
          nome: normNome,
          email: normEmail,
          ativo: ativo ?? true,
          gestor_id: validatedGestorId,
        })
        .eq('id', id)
        .select()
        .single()

      if (updateErr) throw updateErr

      // Atualizar acessos (se o array de sistemas foi fornecido)
      if (Array.isArray(sistemas)) {
        // Deletar acessos existentes deste usuário
        await adminClient.from('core_usuario_sistemas').delete().eq('usuario_id', id)

        const sanitizedSistemas: SistemaInput[] = []
        for (const item of sistemas) {
          if (!item.sistema_id || !item.perfil_id) continue

          // Validar coerência perfil x sistema
          const { data: perfilCheck } = await adminClient
            .from('core_perfis')
            .select('id')
            .eq('id', item.perfil_id)
            .eq('sistema_id', item.sistema_id)
            .maybeSingle()

          if (perfilCheck) {
            sanitizedSistemas.push({
              sistema_id: item.sistema_id,
              perfil_id: item.perfil_id,
            })
          }
        }

        if (sanitizedSistemas.length > 0) {
          const rows = sanitizedSistemas.map((item) => ({
            usuario_id: id,
            sistema_id: item.sistema_id,
            perfil_id: item.perfil_id,
            ativo: true,
          }))

          const { error: insertAcessosErr } = await adminClient
            .from('core_usuario_sistemas')
            .insert(rows)

          if (insertAcessosErr) {
            console.error('Erro ao atualizar acessos:', insertAcessosErr)
          }
        }
      }

      return new Response(JSON.stringify({ success: true, usuario: updatedUser }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // =========================================================================
    // ACTION: toggle_status
    // Ativa ou desativa um usuário corporativo
    // =========================================================================
    if (action === 'toggle_status') {
      const { id } = body

      if (!id) {
        return new Response(JSON.stringify({ error: 'ID do usuário ausente.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: currentUser, error: getErr } = await adminClient
        .from('core_usuarios')
        .select('id, ativo')
        .eq('id', id)
        .single()

      if (getErr || !currentUser) {
        return new Response(JSON.stringify({ error: 'Usuário não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const novoStatus = !currentUser.ativo
      const { data: updatedUser, error: updateErr } = await adminClient
        .from('core_usuarios')
        .update({ ativo: novoStatus })
        .eq('id', id)
        .select()
        .single()

      if (updateErr) throw updateErr

      return new Response(
        JSON.stringify({ success: true, usuario: updatedUser, ativo: novoStatus }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // =========================================================================
    // ACTION: invite_user
    // Envia convite por e-mail via Supabase Auth admin API e vincula auth_user_id
    // =========================================================================
    if (action === 'invite_user') {
      const { id } = body

      if (!id) {
        return new Response(JSON.stringify({ error: 'ID do usuário ausente.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: usuario, error: userErr } = await adminClient
        .from('core_usuarios')
        .select('id, nome, email, auth_user_id, ativo')
        .eq('id', id)
        .single()

      if (userErr || !usuario) {
        return new Response(JSON.stringify({ error: 'Usuário não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Se já tem auth_user_id, envia recuperação de senha ao invés de convite
      if (usuario.auth_user_id) {
        // Enviar link de redefinição de senha
        const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(usuario.email)
        if (resetErr) throw resetErr

        return new Response(
          JSON.stringify({
            success: true,
            message: `Link de redefinição enviado com sucesso para ${usuario.email}.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Verificar se e-mail já existe no Supabase Auth
      const { data: authUsersList } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const existingAuth = (authUsersList?.users || []).find(
        (u) => u.email?.toLowerCase() === usuario.email.toLowerCase(),
      )

      let authUserId: string | null = null
      if (existingAuth) {
        authUserId = existingAuth.id
      } else {
        const { data: inviteData, error: inviteErr } =
          await adminClient.auth.admin.inviteUserByEmail(usuario.email, {
            data: { nome: usuario.nome },
          })

        if (inviteErr) throw inviteErr
        authUserId = inviteData.user?.id || null
      }

      if (authUserId) {
        await adminClient
          .from('core_usuarios')
          .update({ auth_user_id: authUserId })
          .eq('id', usuario.id)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Convite de acesso despachado para ${usuario.email}.`,
          auth_user_id: authUserId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ error: `Ação "${action}" não reconhecida.` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Erro na função manage-core-user:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Erro interno no servidor.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
