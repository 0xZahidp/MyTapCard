# MyTapCard Supabase email setup

The production site is `https://www.mytapcard.online` and the Supabase project ref is
`xdcmgyungrfjkclmmksg`.

## 1. URL configuration

In **Supabase Dashboard → Authentication → URL Configuration**, set:

- Site URL: `https://www.mytapcard.online`
- Redirect URLs:
  - `https://www.mytapcard.online/**`
  - `http://localhost:3000/**`
  - `http://localhost:8080/**`

The wildcard production entry covers the app's current `/dashboard`,
`/auth/callback`, and `/auth/reset-password` destinations. Remove any localhost
entry that the team does not use.

## 2. Email templates

Open **Authentication → Emails → Templates**. Select each template, set its
subject, and paste the complete contents of the matching HTML file.

| Supabase template | Subject | Repository file |
| --- | --- | --- |
| Confirm signup | Confirm your MyTapCard account | `email-templates/confirm-signup.html` |
| Invite user | You're invited to MyTapCard | `email-templates/invite-user.html` |
| Magic Link | Your secure MyTapCard sign-in link | `email-templates/magic-link.html` |
| Change Email Address | Confirm your new MyTapCard email | `email-templates/change-email.html` |
| Reset Password | Reset your MyTapCard password | `email-templates/reset-password.html` |
| Reauthentication | Your MyTapCard verification code | `email-templates/reauthentication.html` |

The templates intentionally use Supabase's `{{ .ConfirmationURL }}` so the
redirect passed by the application is retained. Do not replace it with a fixed
dashboard URL.

## 3. Enable email confirmation

In **Authentication → Sign In / Providers → Email**:

- Enable Email provider.
- Enable Confirm email.
- Keep Secure email change enabled.
- Use an OTP expiry of 3600 seconds or less.

## 4. Configure production SMTP

Create a transactional-email account with an SMTP-capable provider such as
Resend, Postmark, Amazon SES, SendGrid, Brevo, or ZeptoMail. Verify a dedicated
auth sending domain, preferably `auth.mytapcard.online`.

In **Authentication → Emails → SMTP Settings**, enable custom SMTP and enter:

| Field | Value |
| --- | --- |
| Sender name | `MyTapCard` |
| Sender email | `no-reply@auth.mytapcard.online` |
| Host | The SMTP host supplied by the provider |
| Port | `587` with STARTTLS, unless the provider specifies another port |
| Username | The SMTP username supplied by the provider |
| Password | The SMTP password/API credential supplied by the provider |

Do not commit SMTP credentials to this repository or add them to client-side
`VITE_` environment variables. SMTP credentials belong only in Supabase's SMTP
settings.

Before going live, add and verify the provider's DNS records:

- SPF
- DKIM
- DMARC (start with monitoring, for example `p=none`, then tighten after review)

Disable click/open tracking for authentication email. Link rewriting can break
Supabase confirmation links.

## 5. Rate limits and testing

In **Authentication → Rate Limits**, review the email-sending limit after custom
SMTP is enabled. Supabase initially applies a conservative limit; raise it only
to a level supported by the SMTP provider and expected signup traffic.

Test these flows with a real inbox and an incognito browser window:

1. New email/password registration and confirmation.
2. Password reset from the login page.
3. Invitation acceptance, if admin invites are used.
4. Email address change.
5. Magic link and reauthentication, if enabled.

For each test, confirm the message reaches the inbox, the button opens the
correct production domain, the session is created, and the same link cannot be
reused. Check **Authentication → Logs** and the SMTP provider's delivery logs if
a message does not arrive.
