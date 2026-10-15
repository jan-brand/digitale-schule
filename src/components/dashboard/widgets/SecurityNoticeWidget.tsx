import { DashboardWidget } from "@/components/ui/DashboardWidget";
import { Text } from "@/components/ui/Text";
import { CurrentMember } from "@/features/identity/useCurrentMember";

// W-06 "Sicherheitshinweis" (doc/UI_UX_SPECIFICATION.md §6.1/§6.2): only
// rendered when a real, server-observed condition applies — never a
// generic/fake warning — and not dismissible while it applies. The only
// such condition Foundation v0.1 actually tracks is an unverified
// contact email (no real verification-link flow exists yet, so this is
// informational only, not an "verify now" action — doc/README.md M5
// gap notes).
export function useSecurityNotice(member: CurrentMember | null): string | null {
  if (!member) return null;
  if (member.contactEmail && !member.contactEmailVerifiedAt) {
    return "Ihre hinterlegte Kontakt-E-Mail ist noch nicht verifiziert.";
  }
  return null;
}

export function SecurityNoticeWidget({ message }: { message: string }) {
  return (
    <DashboardWidget title="Sicherheitshinweis" size="large">
      <Text>{message}</Text>
    </DashboardWidget>
  );
}
