-- Backfill existing users from auth.users into public.user_profiles
INSERT INTO public.user_profiles (id, full_name, campus_role)
SELECT 
  id, 
  coalesce(raw_user_meta_data->>'full_name', 'Unknown User'), 
  'student'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
