// EmailSender abstraction — planned SMTP path, logged in development.
//
// Campus has no SMTP provider configured yet (no credentials, no chosen
// vendor). Rather than block the verified-email recovery flow (D-012,
// Verfahren A) on that decision, every transactional email goes through
// this interface; which implementation actually runs is picked by the
// EMAIL_PROVIDER environment variable.
//
// Plan for the real SMTP implementation (not built yet, no credentials
// to build it against):
//   - Env vars: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD,
//     SMTP_FROM_ADDRESS, SMTP_FROM_NAME.
//   - Library: a Deno-native SMTP client (e.g. "denomailer" via esm.sh),
//     STARTTLS on the configured port, auth via SMTP_USERNAME/PASSWORD.
//   - Templates: doc/SECURITY_AUTH.md requires no secrets/tokens in logs
//     — the real implementation must NOT log the rendered email body
//     (only template id + recipient + a correlation id), unlike the dev
//     LogEmailSender below, which deliberately logs the full content
//     because there is nowhere else to see it in development.
//   - Delivery failures must not throw a raw provider error back to the
//     caller (doc/SECURITY_AUTH.md: no enumeration, no internal detail
//     leakage) — catch and surface a generic failure.
//
// Until SMTP_* secrets exist, EMAIL_PROVIDER defaults to "log" and
// SmtpEmailSender.send() deliberately throws, so a misconfiguration
// can't silently pretend to have sent something it didn't.

export interface EmailMessage {
  to: string;
  templateId: string;
  data: Record<string, unknown>;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

class LogEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    // Development-only: the whole point is to see the code/link without
    // a real mailbox. Never do this in the planned SmtpEmailSender.
    console.log(`[dev-email] to=${message.to} template=${message.templateId}`, message.data);
  }
}

class SmtpEmailSender implements EmailSender {
  send(_message: EmailMessage): Promise<void> {
    throw new Error("smtp_not_configured: SMTP_* secrets are not set yet — see supabase/functions/_shared/email.ts");
  }
}

export function getEmailSender(): EmailSender {
  const provider = Deno.env.get("EMAIL_PROVIDER") ?? "log";
  return provider === "smtp" ? new SmtpEmailSender() : new LogEmailSender();
}
