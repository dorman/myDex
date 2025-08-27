import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthDialog } from '@/components/AuthDialog'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [hasShownDialog, setHasShownDialog] = useState(false)

  // Show auth dialog for new users (but only once per session)
  useEffect(() => {
    if (!loading && !user && !hasShownDialog) {
      const hasSeenWelcome = localStorage.getItem('myDex-welcome-seen')
      if (!hasSeenWelcome) {
        setShowAuthDialog(true)
        setHasShownDialog(true)
      }
    }
  }, [loading, user, hasShownDialog])

  const handleAuthDialogClose = () => {
    setShowAuthDialog(false)
    localStorage.setItem('myDex-welcome-seen', 'true')
  }

  const handleAuthSuccess = () => {
    setShowAuthDialog(false)
    localStorage.setItem('myDex-welcome-seen', 'true')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <>
      {children}
      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={handleAuthDialogClose}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  )
}
