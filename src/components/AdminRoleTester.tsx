import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccess } from '@/hooks/useAccess';
import { TestTube, RotateCcw, Crown, User, UserX } from 'lucide-react';

export type UserRole = 'admin' | 'paid_user' | 'free_user';

const roleIcons = {
  admin: Crown,
  paid_user: User,
  free_user: UserX,
};

const roleDescriptions = {
  admin: 'Full admin access with unlimited features',
  paid_user: 'Premium features and high request limits',
  free_user: 'Basic access with limited features',
};

export const AdminRoleTester = () => {
  const { testRole, setTestRole, isTestingMode } = useAccess();

  const handleRoleChange = (value: string) => {
    if (value === 'none') {
      setTestRole?.(null);
    } else {
      setTestRole?.(value as UserRole);
    }
  };

  const resetToAdmin = () => {
    setTestRole?.(null);
  };

  const currentRole = (testRole || 'admin') as keyof typeof roleIcons;
  const IconComponent = roleIcons[currentRole];

  return (
    <Card className={`border-2 border-dashed ${isTestingMode ? 'border-yellow-500 bg-yellow-50/10' : 'border-primary/50'}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <IconComponent className={`w-5 h-5 flex-shrink-0 ${isTestingMode ? 'text-yellow-600' : 'text-primary'}`} />
            <div className="min-w-0">
              <div className="font-medium truncate">
                Currently testing as: <span className={isTestingMode ? 'text-yellow-700 font-bold' : ''}>{currentRole}</span>
              </div>
              {isTestingMode && (
                <Badge variant="destructive" className="mt-1">
                  <TestTube className="w-3 h-3 mr-1" />
                  Testing Mode Active
                </Badge>
              )}
              {!isTestingMode && (
                <p className="text-xs text-muted-foreground mt-1">
                  Default admin view - select a role to test user perspectives
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Select value={testRole || 'none'} onValueChange={handleRoleChange}>
              <SelectTrigger className={`w-[140px] ${isTestingMode ? 'border-yellow-500' : ''}`}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="none">Admin (Default)</SelectItem>
                <SelectItem value="paid_user">Premium User</SelectItem>
                <SelectItem value="free_user">Free User</SelectItem>
              </SelectContent>
            </Select>
            
            {isTestingMode && (
              <Button 
                onClick={resetToAdmin} 
                variant="outline" 
                size="sm"
                className="flex-shrink-0 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
        
        {isTestingMode && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Testing as {currentRole}:</strong> {roleDescriptions[currentRole]}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Navigate to any page to see how features appear for this user role. This setting persists until reset.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};