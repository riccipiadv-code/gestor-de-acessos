import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { coreAccessService, type CreateUserData, type UpdateUserData } from './accessService'
import { useAuth } from './AuthContext'
import type { UsuarioComDetalhes, SistemaComEstatisticas, PerfilComEstatisticas } from './types'

interface AccessContextValue {
  usuarios: UsuarioComDetalhes[]
  sistemas: SistemaComEstatisticas[]
  perfis: PerfilComEstatisticas[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  toggleUsuarioAtivo: (id: string) => Promise<{ success: boolean; error?: string; ativo?: boolean }>
  createUsuario: (
    data: CreateUserData,
  ) => Promise<{ success: boolean; error?: string; warning?: string }>
  updateUsuario: (id: string, data: UpdateUserData) => Promise<{ success: boolean; error?: string }>
  inviteOuResetSenha: (
    id: string,
  ) => Promise<{ success: boolean; message?: string; error?: string }>
}

const AccessContext = createContext<AccessContextValue | null>(null)

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioComDetalhes[]>([])
  const [sistemas, setSistemas] = useState<SistemaComEstatisticas[]>([])
  const [perfis, setPerfis] = useState<PerfilComEstatisticas[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setUsuarios([])
      setSistemas([])
      setPerfis([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await coreAccessService.loadAll()
      if (res.error) {
        setError(res.error)
      } else {
        setUsuarios(res.usuarios)
        setSistemas(res.sistemas)
        setPerfis(res.perfis)
      }
    } catch (err: unknown) {
      const e = err as Error
      setError(e?.message || 'Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleUsuarioAtivo = async (id: string) => {
    const res = await coreAccessService.toggleUsuarioAtivo(id)
    if (res.success) {
      await loadData()
    }
    return res
  }

  const createUsuario = async (data: CreateUserData) => {
    const res = await coreAccessService.createUsuario(data)
    if (res.success) {
      await loadData()
    }
    return res
  }

  const updateUsuario = async (id: string, data: UpdateUserData) => {
    const res = await coreAccessService.updateUsuario(id, data)
    if (res.success) {
      await loadData()
    }
    return res
  }

  const inviteOuResetSenha = async (id: string) => {
    return await coreAccessService.inviteOuResetSenha(id)
  }

  return (
    <AccessContext.Provider
      value={{
        usuarios,
        sistemas,
        perfis,
        loading,
        error,
        refresh: loadData,
        toggleUsuarioAtivo,
        createUsuario,
        updateUsuario,
        inviteOuResetSenha,
      }}
    >
      {children}
    </AccessContext.Provider>
  )
}

export function useAccess() {
  const context = useContext(AccessContext)
  if (!context) {
    throw new Error('useAccess deve ser usado dentro de um AccessProvider')
  }
  return context
}
