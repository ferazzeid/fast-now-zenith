import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthDebugger } from '@/hooks/useAuthDebugger';

export const AuthDiagnosticPanel = () => {
  const { runFullAuthDiagnostic } = useAuthDebugger();

  const handleRunDiagnostic = async () => {
    await runFullAuthDiagnostic();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Diagnostic</CardTitle>
        <CardDescription>
          Debug session synchronization issues between frontend and database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleRunDiagnostic}
          variant="outline"
          className="w-full"
        >
          Run Auth Diagnostic
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Check browser console for detailed results
        </p>
      </CardContent>
    </Card>
  );
};