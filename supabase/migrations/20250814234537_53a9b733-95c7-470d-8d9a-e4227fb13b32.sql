-- Create table for tooltip content management
CREATE TABLE public.tooltip_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tooltip_content ENABLE ROW LEVEL SECURITY;

-- Create policies - allow public read access for tooltips to be visible to all users
CREATE POLICY "Tooltip content is viewable by everyone" 
ON public.tooltip_content 
FOR SELECT 
USING (true);

-- Only authenticated users can insert/update (we'll add admin check in the app)
CREATE POLICY "Authenticated users can manage tooltip content" 
ON public.tooltip_content 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tooltip_content_updated_at
BEFORE UPDATE ON public.tooltip_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial content for walking timer
INSERT INTO public.tooltip_content (content_key, content) VALUES 
('walking_timer_health', 'Walking regularly helps improve cardiovascular health, builds stronger bones, and can boost your mood through the release of endorphins. Even short walks make a meaningful difference!');