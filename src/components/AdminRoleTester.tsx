import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRoleTestingContext, UserRole } from '@/contexts/RoleTestingContext';
import { TestTube, RotateCcw, Crown, User, Users, Key, UserX } from 'lucide-react';

const roleIcons = {
  admin: Crown,
  api_user: Key,
  paid_user: Crown,
  granted_user: Users,
  free_user: UserX
};

const roleDescriptions = {
  admin: 'Full admin access with all features',
  api_user: 'User with own OpenAI API key (1000 requests)',
  paid_user: 'Premium subscriber (1000 requests)',
  granted_user: 'Basic user with limited requests (15 requests)',
  free_user: 'Free tier user (15 requests, no AI features)'
};

export const AdminRoleTester = () => {
  const { testRole, setTestRole, isTestingMode } = useRoleTestingContext();

  const handleRoleChange = (value: string) => {
    if (value === 'none') {
      setTestRole(null);
    } else {
      setTestRole(value as UserRole);
    }
  };

  const resetToAdmin = () => {
    setTestRole(null);
  };

  const currentRole = testRole || 'admin';
  const IconComponent = roleIcons[currentRole];

  return (
    <Card className="border-2 border-dashed border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-primary" />
          Role Testing Mode
          {isTestingMode && (
            <Badge variant="destructive" className="ml-2">
              Testing as {testRole}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Switch between user roles to test different user experiences. Admin settings remain accessible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate">
                Currently testing as: {currentRole}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {roleDescriptions[currentRole]}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Select value={testRole || 'none'} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Admin (Default)</SelectItem>
                <SelectItem value="api_user">API User</SelectItem>
                <SelectItem value="paid_user">Premium User</SelectItem>
                <SelectItem value="granted_user">Basic User</SelectItem>
                <SelectItem value="free_user">Free User</SelectItem>
              </SelectContent>
            </Select>
            
            {isTestingMode && (
              <Button 
                onClick={resetToAdmin} 
                variant="outline" 
                size="sm"
                className="flex-shrink-0"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {isTestingMode && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Testing Mode Active:</strong> You're experiencing the app as a {testRole} user. 
              Admin functions remain accessible through this dashboard.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};