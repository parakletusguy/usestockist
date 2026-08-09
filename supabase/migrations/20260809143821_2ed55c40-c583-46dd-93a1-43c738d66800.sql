UPDATE auth.users
SET encrypted_password = crypt('@Bvbpd123456789', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'choiceharrison37@gmail.com';