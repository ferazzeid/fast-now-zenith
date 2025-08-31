import React from 'react';
import { Link } from 'react-router-dom';
import { useSystemGoals } from '@/hooks/useSystemGoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOManager } from '@/components/SEOManager';
import { Target, ArrowRight } from 'lucide-react';

const SystemGoals = () => {
  const { goals, loading } = useSystemGoals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Motivational Goals
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover powerful goals that drive real transformation. Each goal is designed to help you break through barriers and achieve lasting results.
          </p>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <Link
              key={goal.id}
              to={`/motivators/${goal.slug}`}
              className="group block transform transition-all duration-200 hover:scale-105"
            >
              <Card className="h-full overflow-hidden border-2 border-transparent group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10">
                {goal.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={goal.image_url}
                      alt={goal.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {goal.title}
                    </CardTitle>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {goal.content}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {goal.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {goals.length === 0 && !loading && (
          <div className="text-center py-16">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Goals Available</h3>
            <p className="text-muted-foreground">
              Goals are being prepared for your profile. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemGoals;