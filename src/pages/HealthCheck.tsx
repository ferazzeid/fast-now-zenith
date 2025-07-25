import { useEffect } from 'react';

export const HealthCheck = () => {
  useEffect(() => {
    // Set response headers for health check
    document.title = 'Health Check - OK';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600">Health Check: OK</h1>
        <p className="text-muted-foreground mt-2">Application is running normally</p>
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">Status: Healthy</p>
          <p className="text-sm text-green-700">Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  );
};