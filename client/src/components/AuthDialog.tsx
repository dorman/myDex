import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AuthForms } from '@/components/AuthForms'
import { X, Star, TrendingUp, Shield, ArrowLeft } from 'lucide-react'

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'login' | 'signup'
  onAuthSuccess?: () => void
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose, initialTab = 'login', onAuthSuccess }) => {
  const [showAuthForms, setShowAuthForms] = useState(false)
  const [currentTab, setCurrentTab] = useState(initialTab)

  const handleAuthSuccess = () => {
    onAuthSuccess?.()
    onClose()
    setShowAuthForms(false)
  }

  const handleGetStarted = () => {
    setShowAuthForms(true)
    setCurrentTab('signup')
  }

  const handleSignIn = () => {
    setShowAuthForms(true)
    setCurrentTab('login')
  }

  const handleBackToWelcome = () => {
    setShowAuthForms(false)
  }

  const handleClose = () => {
    setShowAuthForms(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-dark-card border-dark-border text-white max-w-md">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute -top-2 -right-2 h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
          {showAuthForms && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToWelcome}
              className="absolute -top-2 -left-2 h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {!showAuthForms ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-center text-xl text-white">
                Welcome to myDex!
              </DialogTitle>
              <DialogDescription className="text-center text-gray-300">
                Your comprehensive investment portfolio management platform
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="text-center text-white">
                {currentTab === 'login' ? 'Welcome Back!' : 'Join myDex'}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-300">
                {currentTab === 'login' ? 'Sign in to access your portfolio' : 'Create your account to unlock all features'}
              </DialogDescription>
            </>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {!showAuthForms ? (
            <>
              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <Shield className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>Secure cloud sync across all devices</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span>Save and track your favorite assets</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <TrendingUp className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span>Advanced portfolio analytics and insights</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 pt-4">
                <Button onClick={handleGetStarted} className="w-full bg-gradient-primary hover:bg-purple-600 text-white">
                  Get Started - It's Free!
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleSignIn} className="flex-1 border-dark-border text-gray-300 hover:text-white hover:border-gray-600">
                    Sign In
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="flex-1 border-dark-border text-gray-300 hover:text-white hover:border-gray-600">
                    Later
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 text-center">
                You can explore myDex without an account, but your data won't be saved
              </p>
            </>
          ) : (
            <AuthForms initialTab={currentTab} onSuccess={handleAuthSuccess} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
