import React, { useState, useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { DashboardView } from './views/DashboardView'
import { DesignSystemView } from './views/DesignSystemView'
import { AuthView } from './views/AuthView'
import { ModulesPreviewView } from './views/ModulesPreviewView'
import { NewRequestModal, AiAssistantDrawer } from './components/modals/QuickActionModals'

export default function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [edition, setEdition] = useState('business') // 'start' | 'business'
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthScreen, setShowAuthScreen] = useState(false)
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [darkMode])

  if (showAuthScreen) {
    return <AuthView onLoginSuccess={() => setShowAuthScreen(false)} />
  }

  return (
    <>
      <AppShell
        activeView={activeView}
        onNavigate={setActiveView}
        edition={edition}
        onEditionChange={setEdition}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setShowAuthScreen(true)}
        onOpenAiAssistant={() => setAiDrawerOpen(true)}
      >
        {activeView === 'dashboard' && (
          <DashboardView
            edition={edition}
            darkMode={darkMode}
            searchQuery={searchQuery}
            onNavigate={setActiveView}
            onOpenNewRequestModal={() => setNewRequestOpen(true)}
          />
        )}

        {activeView === 'design-system' && <DesignSystemView />}

        {activeView !== 'dashboard' && activeView !== 'design-system' && (
          <ModulesPreviewView
            moduleId={activeView}
            edition={edition}
            onBackToDashboard={() => setActiveView('dashboard')}
            onOpenNewRequest={() => setNewRequestOpen(true)}
          />
        )}
      </AppShell>

      <NewRequestModal
        isOpen={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
        edition={edition}
      />

      <AiAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        edition={edition}
      />
    </>
  )
}
