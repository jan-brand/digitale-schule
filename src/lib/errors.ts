// Typed error shape for domain API calls (doc/IMPLEMENTATION_PLAN.md:
// "Alle mit typisierten Fehlern, autorisiert und auditierbar"). Server
// errors (RLS denials, SECURITY DEFINER raises, network failures) get
// normalized into this shape rather than leaking raw Postgres/Supabase
// error text to the UI — see doc/SECURITY_AUTH.md on generic error
// messages / no account-existence disclosure.

export type CampusErrorCode =
  | "unauthorized"
  | "not_found"
  | "validation_failed"
  | "network_error"
  | "unknown_error";

export class CampusError extends Error {
  readonly code: CampusErrorCode;

  constructor(code: CampusErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CampusError";
  }
}

export function toCampusError(error: unknown): CampusError {
  if (error instanceof CampusError) {
    return error;
  }
  if (error instanceof Error) {
    return new CampusError("unknown_error", error.message);
  }
  return new CampusError("unknown_error", "Ein unbekannter Fehler ist aufgetreten.");
}
