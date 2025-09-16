import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Zap, Mic, MessageSquare, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DiagnosticData {
  timeframe: string;
  user_id: string;
  profile: {
    access_level: string;
    monthly_requests: number;
    premium_expires_at: string;
  };
  activity_summary: {
    transcription_requests: number;
    chat_requests: number;
    food_entries_created: number;
    total_ai_requests: number;
  };
  recent_transcriptions: Array<{
    timestamp: string;
    model: string;
    success: boolean;
    response_time_ms: number;
    estimated_cost: number;
  }>;
  recent_chat_completions: Array<{
    timestamp: string;
    model: string;
    tokens_used: number;
    success: boolean;
    response_time_ms: number;
    estimated_cost: number;
  }>;
  recent_food_entries: Array<{
    id: string;
    name: string;
    calories: number;
    carbs: number;
    serving_size: number;
    created_at: string;
  }>;
  patterns: {
    avg_transcription_time: number;
    avg_chat_time: number;
    failed_requests: number;
    total_cost: number;
  };
}

export const VoiceDiagnostics = () => {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('last_hour');
  const { toast } = useToast();
  const { user } = useAuth();

  const runDiagnostics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔍 Running voice diagnostics...');
      const { data: result, error } = await supabase.functions.invoke('voice-diagnostics', {
        body: { timeframe }
      });

      if (error) {
        console.error('Diagnostics error:', error);
        throw error;
      }

      console.log('📊 Diagnostics result:', result);
      setData(result);
      
      toast({
        title: "Diagnostics Complete",
        description: `Analyzed ${result.activity_summary.total_ai_requests} AI requests in the ${timeframe.replace('_', ' ')}`
      });
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        variant: "destructive",
        title: "Diagnostics Failed",
        description: "Failed to gather diagnostic data"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Voice Processing Diagnostics</h2>
        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_10_minutes">Last 10 minutes</SelectItem>
              <SelectItem value="last_hour">Last hour</SelectItem>
              <SelectItem value="last_24_hours">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Run Diagnostics
          </Button>
        </div>
      </div>

      {data && (
        <div className="grid gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center">
                <Mic className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Transcriptions</p>
                  <p className="text-2xl font-bold">{data.activity_summary.transcription_requests}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center">
                <MessageSquare className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">AI Chats</p>
                  <p className="text-2xl font-bold">{data.activity_summary.chat_requests}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center">
                <Utensils className="w-8 h-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Foods Added</p>
                  <p className="text-2xl font-bold">{data.activity_summary.food_entries_created}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center">
                <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Failed Requests</p>
                  <p className="text-2xl font-bold">{data.patterns.failed_requests}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Transcription Time</p>
                  <p className="text-lg font-semibold">{data.patterns.avg_transcription_time}ms</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Chat Processing</p>
                  <p className="text-lg font-semibold">{data.patterns.avg_chat_time}ms</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-lg font-semibold">${data.patterns.total_cost.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transcriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transcriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recent_transcriptions.length === 0 ? (
                  <p className="text-muted-foreground">No transcriptions in selected timeframe</p>
                ) : (
                  data.recent_transcriptions.map((transcription, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transcription.success)}
                        <span className="text-sm">{formatTime(transcription.timestamp)}</span>
                        <Badge variant="outline">{transcription.model}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{transcription.response_time_ms}ms</span>
                        <span>${transcription.estimated_cost.toFixed(4)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Chat Completions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Chat Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recent_chat_completions.length === 0 ? (
                  <p className="text-muted-foreground">No chat completions in selected timeframe</p>
                ) : (
                  data.recent_chat_completions.map((chat, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(chat.success)}
                        <span className="text-sm">{formatTime(chat.timestamp)}</span>
                        <Badge variant="outline">{chat.model}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{chat.tokens_used} tokens</span>
                        <span>{chat.response_time_ms}ms</span>
                        <span>${chat.estimated_cost.toFixed(4)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Food Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Food Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recent_food_entries.length === 0 ? (
                  <p className="text-muted-foreground">No food entries in selected timeframe</p>
                ) : (
                  data.recent_food_entries.map((food) => (
                    <div key={food.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{food.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatTime(food.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{food.serving_size}g</span>
                        <span>{food.calories} cal</span>
                        <span>{food.carbs}g carbs</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Access Level</p>
                  <Badge variant={data.profile.access_level === 'admin' ? 'default' : 'secondary'}>
                    {data.profile.access_level}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly AI Requests</p>
                  <p className="text-lg font-semibold">{data.profile.monthly_requests}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Premium Expires</p>
                  <p className="text-lg font-semibold">
                    {data.profile.premium_expires_at 
                      ? new Date(data.profile.premium_expires_at).toLocaleDateString()
                      : 'No expiry'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};