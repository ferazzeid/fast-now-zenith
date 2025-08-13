-- Add admin role for the user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('84f952e6-690b-473f-b0cc-c579ac077b45', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;