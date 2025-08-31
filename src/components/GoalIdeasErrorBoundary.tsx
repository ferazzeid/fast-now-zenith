import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface GoalIdeasErrorBoundaryProps {
  children: React.ReactNode;
}

interface GoalIdeasErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class GoalIdeasErrorBoundary extends React.Component<GoalIdeasErrorBoundaryProps, GoalIdeasErrorBoundaryState> {
  constructor(props: GoalIdeasErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GoalIdeasErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Goal Ideas Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <GoalIdeasErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

const GoalIdeasErrorFallback = ({ onReset }: { onReset: () => void }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-10">
        <Card className="p-6">
          <CardContent className="text-center space-y-4 p-0">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Goal Ideas Unavailable</h2>
              <p className="text-muted-foreground text-sm">
                There was an error loading the goal ideas. This might be a temporary issue.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={onReset}
                variant="default"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => navigate('/motivators')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Motivators
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};