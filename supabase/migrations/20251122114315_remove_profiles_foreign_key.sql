/*
  # Remove foreign key constraint from profiles to auth.users

  1. Changes
    - Drop the foreign key constraint that references auth.users
    - This constraint is causing schema access errors during authentication
    - The id column will still be a UUID and primary key, just without the FK constraint

  2. Notes
    - We maintain data integrity through application logic instead
    - This prevents cross-schema trigger issues during auth operations
*/

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;
