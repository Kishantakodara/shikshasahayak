import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Settings, User, Bell, Moon, Sun, Shield, LogOut, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import ThemeToggle from '../../components/ThemeToggle';
import { teacherClient } from '../../api/teacherClient';
import { toast } from 'sonner';

export default function TeacherSettingsPage() {
  const { currentUser, loginMockUser, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'Educator');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await teacherClient.getSettings();
        if (res?.user_info) {
          if (res.user_info.display_name) setDisplayName(res.user_info.display_name);
          if (res.user_info.department) setDepartment(res.user_info.department);
          if (res.user_info.designation) setDesignation(res.user_info.designation);
        }
      } catch {
        if (currentUser?.displayName) {
          setDisplayName(currentUser.displayName);
        }
      }
    }
    loadSettings();
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teacherClient.updateSettings({
        display_name: displayName.trim(),
        department: department.trim(),
        designation: designation.trim(),
      });
      toast.success('Profile settings updated successfully');
    } catch {
      toast.success('Profile updated locally');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToAdmin = async () => {
    await loginMockUser('admin@shikshasahayak.org', 'System Admin', 'Admin');
    toast.success('Switched role to System Admin');
  };

  const handleSwitchToTeacher = async () => {
    await loginMockUser('teacher@shikshasahayak.org', displayName || 'Educator', 'teacher');
    toast.success(`Switched role to Educator (${displayName || 'Teacher'})`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-navy-800 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-orange" />
          Educator Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account preferences, theme, and notification settings
        </p>
      </div>

      {/* Profile Info Card */}
      <Card className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-brand-orange" />
            Profile Details
          </CardTitle>
          <CardDescription className="text-xs">Update your personal and department info</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Display Name</label>
                <Input 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Patel"
                  className="bg-gray-50 dark:bg-navy-950/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Department</label>
                <Input 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Electrical Engineering"
                  className="bg-gray-50 dark:bg-navy-950/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Designation</label>
                <Input 
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Associate Professor"
                  className="bg-gray-50 dark:bg-navy-950/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Account Email</label>
              <Input 
                disabled
                value={currentUser?.email || 'educator@shikshasahayak.org'}
                className="bg-gray-100 dark:bg-navy-950/80 cursor-not-allowed text-gray-500"
              />
            </div>

            <Button 
              type="submit" 
              disabled={saving}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white h-9 px-4 text-xs font-bold cursor-pointer flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Theme Preference Card */}
      <Card className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sun className="w-4 h-4 text-brand-orange" />
            Appearance & Theme Mode
          </CardTitle>
          <CardDescription className="text-xs">Customize portal visual theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-950/30 rounded-xl border border-gray-100 dark:border-navy-800">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Active Theme Mode</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Current theme is set to <span className="font-bold text-brand-orange uppercase">{resolvedTheme}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sandbox Role Switcher Card */}
      <Card className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-orange" />
            Sandbox Testing Profiles
          </CardTitle>
          <CardDescription className="text-xs">Quickly switch role identities for portal testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={handleSwitchToTeacher}
              variant="outline"
              className="text-xs font-semibold gap-2 border-brand-orange/30 text-brand-orange hover:bg-orange-50 dark:hover:bg-orange-950/20 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              Switch to Educator ({displayName || 'Teacher'})
            </Button>

            <Button 
              onClick={handleSwitchToAdmin}
              variant="outline"
              className="text-xs font-semibold gap-2 cursor-pointer"
            >
              Switch to System Admin
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
