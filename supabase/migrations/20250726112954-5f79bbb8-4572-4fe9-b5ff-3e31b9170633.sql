-- Add deleted_at column for soft delete functionality
ALTER TABLE public.walking_sessions 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient querying of non-deleted sessions
CREATE INDEX idx_walking_sessions_deleted_at ON public.walking_sessions(deleted_at) WHERE deleted_at IS NULL;