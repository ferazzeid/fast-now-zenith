import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'api_user' | 'paid_user' | 'granted_user' | 'free_user';

interface RoleTestingContextType {
  testRole: UserRole | null;
  setTestRole: (role: UserRole | null) => void;
  isTestingMode: boolean;
  originalRole: UserRole;
}

const RoleTestingContext = createContext<RoleTestingContextType | undefined>(undefined);

interface RoleTestingProviderProps {
  children: ReactNode;
}

export const RoleTestingProvider = ({ children }: RoleTestingProviderProps) => {
  const [testRole, setTestRole] = useState<UserRole | null>(null);
  
  return (
    <RoleTestingContext.Provider value={{
      testRole,
      setTestRole,
      isTestingMode: testRole !== null,
      originalRole: 'admin' // Default original role
    }}>
      {children}
    </RoleTestingContext.Provider>
  );
};

export const useRoleTestingContext = () => {
  const context = useContext(RoleTestingContext);
  if (context === undefined) {
    throw new Error('useRoleTestingContext must be used within a RoleTestingProvider');
  }
  return context;
};