// Precarga de chunks en reposo: la landing anticipa #/demo y la demo anticipa el dashboard
const whenIdle = (fn) => {
  if (typeof window === 'undefined') return () => {}
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout: 4000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(fn, 2500)
  return () => window.clearTimeout(id)
}

export const preloadDemo = () => import('./DemoView')

export const preloadWorkspace = () =>
  Promise.all([
    import('../components/layout/AppShell'),
    import('./DashboardView'),
    import('../components/ui/Primitives'),
    import('../components/modals/QuickActionModals'),
    import('./ModulesPreviewView'),
  ])

export const idlePreloadDemo = () => whenIdle(() => preloadDemo().catch(() => {}))
export const idlePreloadWorkspace = () => whenIdle(() => preloadWorkspace().catch(() => {}))
