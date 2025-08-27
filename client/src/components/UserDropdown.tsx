import React, { useState } from "react";
import { User, ChevronDown, LogIn, UserPlus, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/AuthDialog";
import AccountModal from "./AccountModal";

export default function UserDropdown() {
  const { user, signOut } = useAuth();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<'login' | 'signup'>('login');

  const handleSignIn = () => {
    setAuthDialogTab('login');
    setIsAuthDialogOpen(true);
  };

  const handleSignUp = () => {
    setAuthDialogTab('signup');
    setIsAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // If user is not logged in, show login/signup buttons
  if (!user) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignIn}
            className="text-gray-400 hover:text-white font-medium"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={handleSignUp}
            className="bg-gradient-primary hover:bg-purple-600 text-white font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
        </div>

        <AuthDialog 
          isOpen={isAuthDialogOpen}
          onClose={() => setIsAuthDialogOpen(false)}
          initialTab={authDialogTab}
          onAuthSuccess={() => setIsAuthDialogOpen(false)}
        />
      </>
    );
  }

  // If user is logged in, show user dropdown
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-gray-400 hover:text-white p-2 h-auto"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              {user.fullName ? (
                <span className="text-white text-sm font-medium">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-white text-sm font-medium">
                {user.fullName || 'User'}
              </span>
              <span className="text-gray-400 text-xs">
                {user.email}
              </span>
            </div>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-dark-card border-dark-border text-white min-w-[200px]"
          align="end"
        >
          <DropdownMenuItem 
            onClick={() => setIsAccountModalOpen(true)}
            className="hover:bg-gray-700 cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            My Account
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-dark-border" />
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="hover:bg-gray-700 cursor-pointer text-red-400 hover:text-red-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
      />
    </>
  );
}
