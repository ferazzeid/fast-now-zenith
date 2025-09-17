import React from 'react';
import { IntermittentFastingTimer } from "@/components/IntermittentFastingTimer";
import { ResponsivePageHeader } from "@/components/ResponsivePageHeader";

const IntermittentFasting: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <ResponsivePageHeader 
          title="Intermittent Fasting"
          subtitle="Track your eating and fasting windows"
        />
        
        <div className="space-y-6">
          <IntermittentFastingTimer />
        </div>
      </div>
    </div>
  );
};

export default IntermittentFasting;