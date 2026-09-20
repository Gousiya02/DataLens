import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProjectsPage from './pages/ProjectsPage'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import { clearAuth, getUser } from './utils/auth'

export default function App() {
  const [user, setUserState] = useState(() => getUser())
  const [currentView, setCurrentView] = useState('projects') // 'login', 'register', 'projects', 'upload', 'dashboard'
  const [dashboardData, setDashboardData] = useState(null)

  const handleLoginSuccess = (userData) => {
    setUserState(userData)
    setCurrentView('projects')
  }

  const handleRegisterSuccess = (userData) => {
    setUserState(userData)
    setCurrentView('projects')
  }

  const handleLogout = () => {
    clearAuth()
    setUserState(null)
    setDashboardData(null)
    setCurrentView('login')
  }

  const handleSelectProject = (projectData) => {
    setDashboardData(projectData)
    setCurrentView('dashboard')
  }

  const handleUploaded = (uploadRes) => {
    setDashboardData(uploadRes)
    setCurrentView('dashboard')
  }

  // Auth Guard
  if (!user) {
    if (currentView === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setCurrentView('register')}
      />
    )
  }

  // Authenticated Application Views
  if (currentView === 'upload') {
    return (
      <UploadPage
        onUploaded={handleUploaded}
        onBackToProjects={() => setCurrentView('projects')}
      />
    )
  }

  if (currentView === 'dashboard' && dashboardData) {
    return (
      <DashboardPage
        uploadData={dashboardData}
        onBackToProjects={() => setCurrentView('projects')}
        onNewFile={() => setCurrentView('upload')}
        onLogout={handleLogout}
      />
    )
  }

  // Default view for logged in user: Projects List Page
  return (
    <ProjectsPage
      user={user}
      onSelectProject={handleSelectProject}
      onNewProject={() => setCurrentView('upload')}
      onLogout={handleLogout}
    />
  )
}
