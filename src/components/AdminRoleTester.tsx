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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Role Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Tools for internal role verification.</p>
      </CardContent>
    </Card>
  );
};