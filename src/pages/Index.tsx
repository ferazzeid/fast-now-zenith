import { TodaysDashboard } from '@/components/TodaysDashboard';

const Index = () => {
  return (
    <div className="h-[calc(100vh-80px)] bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
      <div className="max-w-md mx-auto p-4 pt-6 pb-16">{/* FIXED: Reduced top padding for proper spacing */}
        <TodaysDashboard />
      </div>
    </div>
  );
};

export default Index;
