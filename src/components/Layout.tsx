import { Outlet, useNavigate } from 'react-router-dom'
import { Shield, LogOut, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/data/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const getInitials = (nome?: string) => {
    if (!nome) return 'GR'
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937] flex flex-col antialiased">
      {/* Cabeçalho Limpo e Profissional */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
        {/* Lado Esquerdo: Identidade do Sistema */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1B4E8C] to-[#0E7C7B] flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                Gestor de Acesso Ricci
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-[#1B4E8C] border border-blue-200 hidden sm:inline-block">
                Corporativo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Gestão de usuários, acessos e perfis
            </p>
          </div>
        </div>

        {/* Lado Direito: Identificação do Usuário Autenticado e Sair */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200/80 transition-colors bg-white">
                <Avatar className="w-8 h-8 bg-[#1B4E8C] text-white">
                  <AvatarFallback className="bg-[#1B4E8C] text-white text-xs font-semibold">
                    {getInitials(user?.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {user?.nome || 'Usuário Autenticado'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono leading-tight">
                    {user?.email || 'usuario@riccipi.com.br'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-slate-900">
                    {user?.nome || 'Usuário Autenticado'}
                  </p>
                  <p className="text-[11px] leading-none text-slate-500 font-mono">
                    {user?.email || 'usuario@riccipi.com.br'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-medium text-[#1B4E8C] bg-blue-50 px-1.5 py-0.5 rounded w-max">
                    Administrador Gestor
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-xs text-red-600 focus:text-red-700 focus:bg-red-50 font-medium"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair do Gestor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Rodapé Simples e Discreto */}
      <footer className="h-12 border-t border-[#E5E7EB] bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500">
        <div>
          © {currentYear} <span className="font-semibold text-slate-700">Ricci</span> — Gestor de
          Acesso
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Ferramenta Administrativa Corporativa</span>
          <span>v1.0.2</span>
        </div>
      </footer>
    </div>
  )
}
