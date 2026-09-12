import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/AppLayout'
import { AuthProvider } from './contexts/AuthContext'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { RecordsProvider } from './contexts/RecordsContext'
import { HomePage } from './pages/HomePage'

const StatsPage = lazy(() =>
  import('./pages/StatsPage').then((module) => ({ default: module.StatsPage })),
)

function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <RecordsProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route
                path="stats"
                element={
                  <Suspense
                    fallback={<div className="page-loading" aria-busy="true" />}
                  >
                    <StatsPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RecordsProvider>
      </AuthProvider>
    </PreferencesProvider>
  )
}

export default App
