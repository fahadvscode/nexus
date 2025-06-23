-- Manually confirm user fahad@fahadsold.com
-- This migration confirms the user account that was created but couldn't be confirmed via email

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(), 
  updated_at = NOW()
WHERE email = 'fahad@fahadsold.com' 
  AND email_confirmed_at IS NULL; 