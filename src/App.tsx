/* Main App Component - Handles routing (using react-router-dom), auth and access providers */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import UsuariosPage from './pages/Usuarios'
import LoginPage from './pages/Login'
import RedefinirSenhaPage from './pages/RedefinirSenha'
import PrimeiroAcessoPage from './pages/PrimeiroAcesso'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { AccessProvider } from './lib/data/AccessContext'
import { AuthProvider, useAuth } from './lib/data/AuthContext'
import { passwordRecoveryStorage } from './lib/data/passwordRecoveryStorage'
import { inviteSessionStorage } from './lib/data/inviteSessionStorage'

// Componente de proteção de rota administrativa
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPasswordRecovery, isFirstAccess, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-xs text-slate-500 font-medium">Carregando ambiente seguro...</div>
      </div>
    )
  }

  // Sessão de primeiro acesso (convite) NUNCA tem acesso às rotas administrativas
  if (
    isFirstAccess ||
    inviteSessionStorage.isPending() ||
    inviteSessionStorage.hasInviteUrlParams()
  ) {
    return <Navigate to="/primeiro-acesso" replace />
  }

  // Sessão de recuperação de senha NUNCA tem acesso às rotas administrativas
  // Redireciona imediatamente para a tela de redefinição
  if (
    isPasswordRecovery ||
    passwordRecoveryStorage.isPending() ||
    passwordRecoveryStorage.hasRecoveryUrlParams()
  ) {
    return <Navigate to="/redefinir-senha" replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Guard da tela de login: se houver convite ou recuperação pendente, impede login e redireciona
function LoginRouteGuard() {
  const { isPasswordRecovery, isFirstAccess, isAuthenticated, isLoading } = useAuth()

  // Se houver sinal imediato de convite (hash/search) ou storage de primeiro acesso, vai para /primeiro-acesso
  if (
    isFirstAccess ||
    inviteSessionStorage.isPending() ||
    inviteSessionStorage.hasInviteUrlParams()
  ) {
    return <Navigate to="/primeiro-acesso" replace />
  }

  // Se houver sinal imediato na URL (hash/search) ou storage de recovery, vai direto para /redefinir-senha
  if (
    isPasswordRecovery ||
    passwordRecoveryStorage.isPending() ||
    passwordRecoveryStorage.hasRecoveryUrlParams()
  ) {
    return <Navigate to="/redefinir-senha" replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-xs text-slate-500 font-medium">Carregando ambiente seguro...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/usuarios" replace />
  }

  return <LoginPage />
}

// Raiz: se convite -> /primeiro-acesso, se recuperação -> /redefinir-senha, se autenticado -> /usuarios, senão -> /login
function RootRedirect() {
  const { isAuthenticated, isPasswordRecovery, isFirstAccess, isLoading } = useAuth()

  if (
    isFirstAccess ||
    inviteSessionStorage.isPending() ||
    inviteSessionStorage.hasInviteUrlParams()
  ) {
    return <Navigate to="/primeiro-acesso" replace />
  }

  if (
    isPasswordRecovery ||
    passwordRecoveryStorage.isPending() ||
    passwordRecoveryStorage.hasRecoveryUrlParams()
  ) {
    return <Navigate to="/redefinir-senha" replace />
  }

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

            {/* Tela de Login protegida contra fluxo de recovery */}
            <Route path="/login" element={<LoginRouteGuard />} />

            {/* Tela pública dedicada de Primeiro Acesso (link de convite inviteUserByEmail do Supabase Auth) */}
            <Route path="/primeiro-acesso" element={<PrimeiroAcessoPage />} />

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
