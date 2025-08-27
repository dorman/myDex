import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { X, User, Mail, Globe, Shield, Bell } from "lucide-react";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserAccount {
  fullName: string;
  email: string;
  username: string;
  bio: string;
  country: string;
  timezone: string;
  currency: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  twoFactorAuth: boolean;
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const [account, setAccount] = useState<UserAccount>({
    fullName: "",
    email: "",
    username: "",
    bio: "",
    country: "",
    timezone: "UTC",
    currency: "USD",
    emailNotifications: true,
    pushNotifications: true,
    darkMode: true,
    twoFactorAuth: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof UserAccount, value: string | boolean) => {
    setAccount(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Account data to save:", account);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-card border-dark-border text-white max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              My Account
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <User className="h-4 w-4 mr-2" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={account.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-dark-bg border-dark-border text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={account.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="bg-dark-bg border-dark-border text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={account.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Choose a username"
                  className="bg-dark-bg border-dark-border text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                <Textarea
                  id="bio"
                  value={account.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="bg-dark-bg border-dark-border text-white placeholder-gray-400 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-dark-border" />

          {/* Location & Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Location & Preferences
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="country" className="text-gray-300">Country</Label>
                <Select value={account.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-border text-white">
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="JP">Japan</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                <Select value={account.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                  <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-border text-white">
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                    <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                    <SelectItem value="JST">Japan Standard Time (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="currency" className="text-gray-300">Preferred Currency</Label>
                <Select value={account.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-border text-white">
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-dark-border" />

          {/* Notification Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive portfolio updates via email</p>
                </div>
                <Switch
                  checked={account.emailNotifications}
                  onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive real-time alerts</p>
                </div>
                <Switch
                  checked={account.pushNotifications}
                  onCheckedChange={(checked) => handleInputChange('pushNotifications', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-dark-border" />

          {/* Security Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={account.twoFactorAuth}
                  onCheckedChange={(checked) => handleInputChange('twoFactorAuth', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Dark Mode</Label>
                  <p className="text-sm text-gray-500">Toggle dark theme</p>
                </div>
                <Switch
                  checked={account.darkMode}
                  onCheckedChange={(checked) => handleInputChange('darkMode', checked)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-dark-border text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-primary hover:bg-purple-600 text-white"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
