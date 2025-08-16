/**
 * Authentication System Validation Utility
 * 
 * This utility helps verify that the unified authentication system is working correctly
 * after the comprehensive authentication chaos cleanup.
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuthSystemStatus {
  isAdmin: boolean;
  accessLevel: string;
  systemsAligned: boolean;
  errors: string[];
  warnings: string[];
}

export const validateAuthSystem = async (userId: string): Promise<AuthSystemStatus> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Test 1: Check unified admin function
    const { data: isAdminData, error: adminError } = await supabase.rpc('is_current_user_admin');
    if (adminError) {
      errors.push(`Unified admin function failed: ${adminError.message}`);
    }
    
    // Test 2: Check profiles.access_level
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('access_level, subscription_tier')
      .eq('user_id', userId)
      .single();
      
    if (profileError) {
      errors.push(`Profile access check failed: ${profileError.message}`);
    }
    
    // Test 3: Check for legacy admin systems (should not be used)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin');
      
    if (!roleError && roleData && roleData.length > 0) {
      warnings.push('Legacy user_roles admin entry found - should be migrated to access_level');
    }
    
    // Test 4: Check RLS policy on shared_settings (this was the original issue)
    const { error: settingsError } = await supabase
      .from('shared_settings')
      .select('setting_key')
      .limit(1);
      
    if (settingsError) {
      errors.push(`shared_settings RLS test failed: ${settingsError.message}`);
    }
    
    const isAdmin = !!isAdminData;
    const accessLevel = profileData?.access_level || 'unknown';
    const systemsAligned = isAdmin === (accessLevel === 'admin');
    
    if (!systemsAligned) {
      errors.push('Admin status mismatch between unified function and access_level');
    }
    
    return {
      isAdmin,
      accessLevel,
      systemsAligned,
      errors,
      warnings
    };
    
  } catch (error) {
    return {
      isAdmin: false,
      accessLevel: 'error',
      systemsAligned: false,
      errors: [`System validation failed: ${error}`],
      warnings
    };
  }
};

export const logAuthSystemStatus = async (userId: string) => {
  const status = await validateAuthSystem(userId);
  
  console.log('🔍 Authentication System Status:');
  console.log('└── Admin Status:', status.isAdmin ? '✅ Admin' : '❌ Not Admin');
  console.log('└── Access Level:', status.accessLevel);
  console.log('└── Systems Aligned:', status.systemsAligned ? '✅ Yes' : '❌ No');
  
  if (status.errors.length > 0) {
    console.log('🚨 Errors:', status.errors);
  }
  
  if (status.warnings.length > 0) {
    console.log('⚠️ Warnings:', status.warnings);
  }
  
  return status;
};