import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOManager } from '@/components/SEOManager';
import { ArrowLeft, Target } from 'lucide-react';
import { SystemGoal } from '@/hooks/useSystemGoals';

const MotivatorDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [goal, setGoal] = useState<SystemGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadGoal = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('motivators')
          .select('*')
          .eq('slug', slug)
          .eq('is_system_goal', true)
          .eq('is_active', true)
          .eq('is_published', true)
          .single();

        if (error) {
          console.error('Error loading goal:', error);
          setNotFound(true);
          return;
        }

        setGoal(data);
      } catch (error) {
        console.error('Error loading goal:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadGoal();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="aspect-video w-full mb-6 rounded-lg" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-6 w-24 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !goal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-2xl mx-auto py-16 text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Goal Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The motivational goal you're looking for doesn't exist or may have been removed.
          </p>
          <Link to="/motivators">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Goals
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/motivators" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Goals
        </Link>

        {/* Goal Content */}
        <Card className="overflow-hidden">
          {goal.image_url && (
            <div className="aspect-video overflow-hidden">
              <img
                src={goal.image_url}
                alt={goal.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          )}
          
          <CardContent className="p-6 md:p-8">
            {/* Title and Category */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="capitalize">
                  {goal.category}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {goal.title}
              </h1>
            </div>

            {/* Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="text-lg leading-relaxed whitespace-pre-wrap">
                {goal.content}
              </div>
            </div>

            {/* Action Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ready to start your transformation journey?
                </p>
                <Link to="/timer">
                  <Button size="lg" className="ml-4">
                    Start Fasting
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MotivatorDetail;