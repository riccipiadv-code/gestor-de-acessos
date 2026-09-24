import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Layers,
  ShieldCheck,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  title: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Usuários', path: '/usuarios', icon: Users },
  { title: 'Sistemas', path: '/sistemas', icon: Layers },
  { title: 'Perfis', path: '/perfis', icon: ShieldCheck },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard'
      case '/usuarios':
        return 'Usuários'
      case '/sistemas':
        return 'Sistemas Corporativos'
      case '/perfis':
        return 'Perfis de Acesso'
      default:
        return 'Gestor de Acesso'
    }
  }

  const getPageSubtitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Visão geral do controle de acessos corporativos'
      case '/usuarios':
        return 'Cadastro central de identidades e acessos corporativos'
      case '/sistemas':
        return 'Sistemas internos registrados no ecossistema Ricci'
      case '/perfis':
        return 'Perfis de permissão parametrizados por sistema'
      default:
        return 'Ecossistema Ricci'
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937] flex flex-col antialiased">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop (fixed) & Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0F1E36] text-white flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1B4E8C] to-[#0E7C7B] flex items-center justify-center shadow-md shadow-black/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-wide text-white flex items-center gap-1.5">
                Gestor de Acesso
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ricci
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Controle Central de Acessos</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corporate Context Pill */}
        <div className="px-4 py-3">
          <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">Ambiente Central</span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] text-slate-300 border-white/20 bg-white/5"
            >
              Corporativo
            </Badge>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navegação Principal
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1B4E8C] text-white shadow-sm shadow-[#1B4E8C]/40 border-l-4 border-[#0E7C7B]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="flex-1">{item.title}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Systems Reference Callout */}
        <div className="p-4 mx-3 mb-3 bg-white/[0.04] rounded-lg border border-white/10">
          <div className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
            <span>Sistemas Conectados</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Conectaí e Ricci Task operam de forma independente. As regras aqui gerenciam os acessos
            centrais.
          </p>
        </div>

        {/* User Mini Card in Sidebar */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border border-white/20 bg-[#1B4E8C]">
              <AvatarFallback className="bg-[#1B4E8C] text-white text-xs font-semibold">
                AR
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">Antônio Ricci</div>
              <div className="text-[11px] text-slate-400 truncate">
                antonio.ricci@riccipi.com.br
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Fixed Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block truncate">{getPageSubtitle()}</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global quick indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium">Segurança Central Ativa</span>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors">
                  <Avatar className="w-8 h-8 bg-[#1B4E8C] text-white">
                    <AvatarFallback className="bg-[#1B4E8C] text-white text-xs font-medium">
                      AR
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-slate-800">Antônio Ricci</div>
                    <div className="text-[10px] text-slate-500">Administrador Geral</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold leading-none text-slate-900">
                      Antônio Ricci
                    </p>
                    <p className="text-[11px] leading-none text-slate-500">
                      antonio.ricci@riccipi.com.br
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-medium text-[#1B4E8C] bg-blue-50 px-1.5 py-0.5 rounded w-max">
                      Sessão Corporativa
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-xs">
                  <UserIcon className="w-4 h-4 mr-2 text-slate-500" />
                  Perfil Administrativo
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-xs">
                  <Shield className="w-4 h-4 mr-2 text-slate-500" />
                  Logs de Acesso Central
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-xs text-slate-500 focus:text-slate-700">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair do Gestor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="h-12 border-t border-[#E5E7EB] bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500">
          <div>
            © {currentYear} <span className="font-semibold text-slate-700">Ricci</span> — Gestor de
            Acesso Corporativo
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hidden sm:inline">Aplicação Administrativa Independente</span>
            <span className="font-mono text-slate-400">v1.0.0-central</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
