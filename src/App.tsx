/* Main App Component - Handles routing (using react-router-dom), auth and access providers */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import UsuariosPage from './pages/Usuarios'
import LoginPage from './pages/Login'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { AccessProvider } from './lib/data/AccessContext'
import { AuthProvider, useAuth } from './lib/data/AuthContext'

// Componente de proteção de rota
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-xs text-slate-500 font-medium">Carregando ambiente seguro...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Raiz: se autenticado vai para /usuarios, senão /login
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-xs text-slate-500 font-medium">Carregando ambiente seguro...</div>
      </div>
    )
  }

  return <Navigate to={isAuthenticated ? '/usuarios' : '/login'} replace />
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AccessProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Rota inicial: redireciona conforme autenticação */}
            <Route path="/" element={<RootRedirect />} />

            {/* Tela de Login simples */}
            <Route path="/login" element={<LoginPage />} />

            {/* Layout administrativo limpo (apenas tela de Gestão de Usuários) */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/usuarios" element={<UsuariosPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AccessProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
