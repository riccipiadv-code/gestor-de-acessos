/* Main App Component - Handles routing (using react-router-dom), auth and access providers */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import UsuariosPage from './pages/Usuarios'
import LoginPage from './pages/Login'
import RedefinirSenhaPage from './pages/RedefinirSenha'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { AccessProvider } from './lib/data/AccessContext'
import { AuthProvider, useAuth } from './lib/data/AuthContext'

// Componente de proteção de rota administrativa
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPasswordRecovery, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-xs text-slate-500 font-medium">Carregando ambiente seguro...</div>
      </div>
    )
  }

  // Sessão de recuperação de senha NUNCA tem acesso às rotas administrativas
  if (isPasswordRecovery) {
    return <Navigate to="/redefinir-senha" replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Raiz: se for recuperação vai para /redefinir-senha, se autenticado vai para /usuarios, senão /login
function RootRedirect() {
  const { isAuthenticated, isPasswordRecovery, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-xs text-slate-500 font-medium">Carregando ambiente seguro...</div>
      </div>
    )
  }

  if (isPasswordRecovery) {
    return <Navigate to="/redefinir-senha" replace />
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

            {/* Tela de Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Tela dedicada de Redefinição de Senha (link de recuperação do Supabase Auth) */}
            <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />

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
