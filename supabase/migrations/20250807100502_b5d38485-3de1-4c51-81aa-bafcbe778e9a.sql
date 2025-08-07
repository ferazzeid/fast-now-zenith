-- Create table to track motivator image generations
CREATE TABLE public.motivator_image_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  motivator_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  prompt TEXT NOT NULL,
  filename TEXT NOT NULL,
  bucket TEXT DEFAULT 'motivator-images',
  image_url TEXT,
  error_message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.motivator_image_generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own image generations" 
ON public.motivator_image_generations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image generations" 
ON public.motivator_image_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image generations" 
ON public.motivator_image_generations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all image generations" 
ON public.motivator_image_generations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_motivator_image_generations_updated_at
BEFORE UPDATE ON public.motivator_image_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_motivator_image_generations_user_id ON public.motivator_image_generations(user_id);
CREATE INDEX idx_motivator_image_generations_motivator_id ON public.motivator_image_generations(motivator_id);
CREATE INDEX idx_motivator_image_generations_status ON public.motivator_image_generations(status);