/*
  # Fix Function Search Paths for Security

  ## Summary
  This migration fixes the search path configuration for all functions to prevent
  security vulnerabilities. Functions with mutable search paths can be exploited
  through schema injection attacks.

  ## Changes
  - Drop and recreate functions with explicit search_path
  - Use 'pg_catalog, public' to ensure functions only use trusted schemas
  - This prevents potential security vulnerabilities

  ## Security Impact
  - Protects against schema injection attacks
  - Ensures functions always reference the correct schema
  - Follows PostgreSQL security best practices
*/

-- =============================================================================
-- Fix get_staff_role function
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_staff_role(uuid);

CREATE FUNCTION public.get_staff_role(user_uuid uuid)
RETURNS staff_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  staff_role_value staff_role;
BEGIN
  SELECT role INTO staff_role_value
  FROM public.staff
  WHERE user_id = user_uuid;
  
  RETURN staff_role_value;
END;
$$;

-- =============================================================================
-- Fix decrease_book_copies function
-- =============================================================================

DROP FUNCTION IF EXISTS public.decrease_book_copies() CASCADE;

CREATE FUNCTION public.decrease_book_copies()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.books
  SET available_copies = available_copies - 1
  WHERE id = NEW.book_id
  AND available_copies > 0;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_borrow_decrease_copies ON borrow_records;
CREATE TRIGGER on_borrow_decrease_copies
  AFTER INSERT ON borrow_records
  FOR EACH ROW
  EXECUTE FUNCTION decrease_book_copies();

-- =============================================================================
-- Fix increase_book_copies function
-- =============================================================================

DROP FUNCTION IF EXISTS public.increase_book_copies() CASCADE;

CREATE FUNCTION public.increase_book_copies()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
    UPDATE public.books
    SET available_copies = available_copies + 1
    WHERE id = NEW.book_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_return_increase_copies ON borrow_records;
CREATE TRIGGER on_return_increase_copies
  AFTER UPDATE ON borrow_records
  FOR EACH ROW
  EXECUTE FUNCTION increase_book_copies();

-- =============================================================================
-- Fix update_overdue_records function
-- =============================================================================

DROP FUNCTION IF EXISTS public.update_overdue_records();

CREATE FUNCTION public.update_overdue_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.borrow_records
  SET status = 'overdue'
  WHERE due_date < CURRENT_TIMESTAMP
  AND return_date IS NULL
  AND status != 'overdue';
END;
$$;

-- =============================================================================
-- Fix generate_fines_for_overdue function
-- =============================================================================

DROP FUNCTION IF EXISTS public.generate_fines_for_overdue();

CREATE FUNCTION public.generate_fines_for_overdue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.fines (borrow_id, fine_amount, paid_status)
  SELECT 
    br.id,
    (EXTRACT(DAY FROM CURRENT_TIMESTAMP - br.due_date) * 10)::numeric,
    'unpaid'
  FROM public.borrow_records br
  WHERE br.status = 'overdue'
  AND br.return_date IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.fines f WHERE f.borrow_id = br.id
  );
END;
$$;

-- =============================================================================
-- Fix create_staff_auth_user function
-- =============================================================================

DROP FUNCTION IF EXISTS public.create_staff_auth_user(text, text);

CREATE FUNCTION public.create_staff_auth_user(
  staff_email text,
  user_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    staff_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;
  
  UPDATE public.staff
  SET user_id = new_user_id
  WHERE email = staff_email;
  
  result := json_build_object(
    'user_id', new_user_id,
    'email', staff_email,
    'success', true
  );
  
  RETURN result;
END;
$$;

-- =============================================================================
-- Fix check_staff_auth_status function
-- =============================================================================

DROP FUNCTION IF EXISTS public.check_staff_auth_status();

CREATE FUNCTION public.check_staff_auth_status()
RETURNS TABLE (
  staff_id integer,
  staff_name text,
  staff_email text,
  staff_role staff_role,
  has_auth boolean,
  auth_user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.email,
    s.role,
    (s.user_id IS NOT NULL) as has_auth,
    s.user_id
  FROM public.staff s
  ORDER BY s.id;
END;
$$;
