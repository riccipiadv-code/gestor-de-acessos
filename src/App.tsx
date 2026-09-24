/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import UsuariosPage from './pages/Usuarios'
import SistemasPage from './pages/Sistemas'
import PerfisPage from './pages/Perfis'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { AccessProvider } from './lib/data/AccessContext'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter>
    <AccessProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/sistemas" element={<SistemasPage />} />
            <Route path="/perfis" element={<PerfisPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AccessProvider>
  </BrowserRouter>
)

export default App
