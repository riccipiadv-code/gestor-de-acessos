import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import { accessService } from './accessService'
import type { UsuarioComDetalhes, SistemaComEstatisticas, PerfilComEstatisticas } from './types'

interface AccessContextValue {
  usuarios: UsuarioComDetalhes[]
  sistemas: SistemaComEstatisticas[]
  perfis: PerfilComEstatisticas[]
  refresh: () => void
  // Métodos expostos
  toggleUsuarioAtivo: (id: string) => boolean
  createUsuario: (data: Parameters<typeof accessService.createUsuario>[0]) => void
  updateUsuario: (id: string, data: Parameters<typeof accessService.updateUsuario>[1]) => void
  toggleSistemaAtivo: (id: string) => boolean
  createSistema: (data: Parameters<typeof accessService.createSistema>[0]) => void
  updateSistema: (id: string, data: Parameters<typeof accessService.updateSistema>[1]) => void
  togglePerfilAtivo: (id: string) => boolean
  createPerfil: (data: Parameters<typeof accessService.createPerfil>[0]) => void
  updatePerfil: (id: string, data: Parameters<typeof accessService.updatePerfil>[1]) => void
}

const AccessContext = createContext<AccessContextValue | null>(null)

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, startTransition] = useTransition()
  const [usuarios, setUsuarios] = useState<UsuarioComDetalhes[]>(() => accessService.listUsuarios())
  const [sistemas, setSistemas] = useState<SistemaComEstatisticas[]>(() =>
    accessService.listSistemas(),
  )
  const [perfis, setPerfis] = useState<PerfilComEstatisticas[]>(() => accessService.listPerfis())

  const loadAll = () => {
    startTransition(() => {
      setUsuarios(accessService.listUsuarios())
      setSistemas(accessService.listSistemas())
      setPerfis(accessService.listPerfis())
    })
  }

  useEffect(() => {
    const unsubscribe = accessService.subscribe(() => {
      loadAll()
    })
    return () => unsubscribe()
  }, [])

  const value: AccessContextValue = {
    usuarios,
    sistemas,
    perfis,
    refresh: loadAll,
    toggleUsuarioAtivo: (id: string) => accessService.toggleUsuarioAtivo(id),
    createUsuario: (data) => accessService.createUsuario(data),
    updateUsuario: (id, data) => accessService.updateUsuario(id, data),
    toggleSistemaAtivo: (id: string) => accessService.toggleSistemaAtivo(id),
    createSistema: (data) => accessService.createSistema(data),
    updateSistema: (id, data) => accessService.updateSistema(id, data),
    togglePerfilAtivo: (id: string) => accessService.togglePerfilAtivo(id),
    createPerfil: (data) => accessService.createPerfil(data),
    updatePerfil: (id, data) => accessService.updatePerfil(id, data),
  }

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const context = useContext(AccessContext)
  if (!context) {
    throw new Error('useAccess deve ser usado dentro de um AccessProvider')
  }
  return context
}
