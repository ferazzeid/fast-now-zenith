import { useState, useEffect } from 'react';
import { Users, Settings, Key, BarChart3, DollarSign, Eye, EyeOff, Smartphone, Image, Brain, MessageSquare, Sliders, Plus, AlertTriangle, CreditCard, MessageCircle, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { RealApiUsageStats } from '@/components/RealApiUsageStats';
import { AdminTierStats } from '@/components/AdminTierStats';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto pt-20 pb-24 space-y-8">
          
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your app settings and monitor usage</p>
          </div>

          {/* 4-Tier User Metrics */}
          <AdminTierStats />

          {/* Real API Usage Stats */}
          <RealApiUsageStats />

        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminOverview;