# Supabase email OTP template

Use this when users sign in with **Continue with Email** on the login page. They receive a **6-digit code** and enter it in the app (not a magic link).

## 1. Enable email OTP in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Providers** → **Email**.
3. Enable **Email** sign-in.
4. Turn on **Email OTP** (wording may be “Enable OTP” or include OTP in email sign-in options).
5. Optional: disable **Magic Link** if you only want codes (otherwise users may still get a link in email).
6. Save.

## 2. Edit the email template to show the OTP

1. Go to **Authentication** → **Email Templates**.
2. Open the template used for sign-in OTP (often **Magic Link** when OTP is enabled).
3. Set the subject, for example:

   ```
   Your Fitness Tracker sign-in code
   ```

4. Use **`{{ .Token }}`** in the body for the 6-digit code.

### Example HTML body

```html
<h2>Your sign-in code</h2>
<p>Enter this code in the Fitness Tracker app to sign in:</p>
<p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">
  {{ .Token }}
</p>
<p>This code expires in a few minutes. If you didn't request it, you can ignore this email.</p>
```

### Example plain-text body

```
Your Fitness Tracker sign-in code

{{ .Token }}

Enter this code in the app to sign in. It expires shortly.
```

## 3. Available template variables

| Variable | Description |
|----------|-------------|
| `{{ .Token }}` | 6-digit OTP code |
| `{{ .Email }}` | User's email |
| `{{ .SiteURL }}` | Site URL from project settings |
| `{{ .ConfirmationURL }}` | Magic link URL (if magic link is also enabled) |

## 4. Test the flow

1. Run the app and open `/login`.
2. Enter your email → **Continue with Email**.
3. You should see the **Enter verification code** step in the app.
4. Check your inbox (and Supabase **Authentication** → **Logs** if using the built-in mailer in dev).
5. Enter the 6-digit code → **Verify & sign in** → redirect to `/dashboard`.

## 5. Local development mail

- Supabase may rate-limit OTP emails; wait between tests.
- In development, view outgoing auth emails under **Authentication** → **Logs** or configure custom SMTP under **Project Settings** → **Auth** → **SMTP**.

See also [supabase-auth-setup.md](./supabase-auth-setup.md) for redirect URLs and environment variables.
