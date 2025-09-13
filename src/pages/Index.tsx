import { TodaysDashboard } from '@/components/TodaysDashboard';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-md mx-auto p-4 pt-8 pb-32 safe-bottom">
        <TodaysDashboard />
      </div>
    </div>
  );
};

export default Index;
