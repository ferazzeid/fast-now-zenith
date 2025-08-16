import { debugAuthState, testJWTToken } from '@/utils/authDebugger';
import { useToast } from '@/hooks/use-toast';

export const useAuthDebugger = () => {
  const { toast } = useToast();

  const runFullAuthDiagnostic = async () => {
    console.log('🔧 Starting comprehensive auth diagnostic...');
    
    try {
      const results = await debugAuthState();
      console.log('📊 Full Diagnostic Results:', results);
      
      // Test JWT token specifically
      const jwtResults = await testJWTToken();
      console.log('🎫 JWT Token Test:', jwtResults);
      
      // Provide user feedback
      if (!results.frontendSession) {
        toast({
          title: "Auth Issue: No Frontend Session",
          description: "User is not authenticated on frontend",
          variant: "destructive",
        });
      } else if (!results.rlsWorking) {
        toast({
          title: "Auth Issue: RLS Failing",
          description: "JWT token not being passed to database - core session issue found",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Auth Working",
          description: "Authentication and RLS are functioning correctly",
        });
      }
      
      return { ...results, jwtTest: jwtResults };
      
    } catch (error) {
      console.error('❌ Auth diagnostic failed:', error);
      toast({
        title: "Diagnostic Failed",
        description: "Unable to run auth diagnostic",
        variant: "destructive",
      });
      return null;
    }
  };

  return { runFullAuthDiagnostic };
};