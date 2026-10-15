import { supabase } from "@/lib/supabase";
import { CampusError } from "@/lib/errors";

// Typed wrappers for M10's school-organization screens (school years,
// classes, class leadership, class rosters). Unlike the identity-domain
// wrappers in adminApi.ts, these are plain RLS-protected table
// operations — academic structure writes are "not identity-privilege-
// sensitive" (supabase/migrations/20261013220006_rls_policies.sql), so
// there's no SECURITY DEFINER wrapper layer here, consistent with how
// that migration already treats school_years/classes/
// class_staff_assignments.

function toCampusError(error: unknown, fallback: string): CampusError {
  return new CampusError("unknown_error", error instanceof Error ? error.message : fallback);
}

// D-004: one account belongs to exactly one school, so resolving the
// caller's own school is always exactly one row — used by every create*
// helper below that needs a school_id for the insert.
async function resolveOwnSchoolId(): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("school_memberships")
    .select("school_id")
    .eq("user_id", user.user?.id ?? "")
    .maybeSingle();
  if (error || !data) throw toCampusError(error, "Schule konnte nicht ermittelt werden.");
  return data.school_id;
}

export interface SchoolYear {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
}

export async function listSchoolYears(): Promise<SchoolYear[]> {
  const { data, error } = await supabase
    .from("school_years")
    .select("id, name, starts_on, ends_on")
    .order("starts_on", { ascending: false });
  if (error) throw toCampusError(error, "Schuljahre konnten nicht geladen werden.");
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, startsOn: row.starts_on, endsOn: row.ends_on }));
}

export async function createSchoolYear(name: string, startsOn: string, endsOn: string): Promise<void> {
  const schoolId = await resolveOwnSchoolId();
  const { error } = await supabase
    .from("school_years")
    .insert({ school_id: schoolId, name, starts_on: startsOn, ends_on: endsOn });
  if (error) throw toCampusError(error, "Schuljahr konnte nicht angelegt werden.");
}

export interface SchoolClass {
  id: string;
  name: string;
  schoolYearId: string;
}

export async function listClasses(): Promise<SchoolClass[]> {
  const { data, error } = await supabase.from("classes").select("id, name, school_year_id").order("name");
  if (error) throw toCampusError(error, "Klassen konnten nicht geladen werden.");
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, schoolYearId: row.school_year_id }));
}

export async function createClass(name: string, schoolYearId: string): Promise<void> {
  const schoolId = await resolveOwnSchoolId();
  const { error } = await supabase.from("classes").insert({ school_id: schoolId, name, school_year_id: schoolYearId });
  if (error) throw toCampusError(error, "Klasse konnte nicht angelegt werden.");
}

export interface ClassLeader {
  assignmentId: string;
  membershipId: string;
  firstName: string;
  lastName: string;
}

interface ClassStaffRow {
  id: string;
  membership_id: string;
  school_memberships: { profiles: { first_name: string; last_name: string } | null } | null;
}

export async function listClassLeaders(classId: string): Promise<ClassLeader[]> {
  const { data, error } = await supabase
    .from("class_staff_assignments")
    .select("id, membership_id, school_memberships(profiles(first_name, last_name))")
    .eq("class_id", classId)
    .is("ended_at", null)
    .returns<ClassStaffRow[]>();
  if (error) throw toCampusError(error, "Klassenleitung konnte nicht geladen werden.");
  return (data ?? []).map((row) => ({
    assignmentId: row.id,
    membershipId: row.membership_id,
    firstName: row.school_memberships?.profiles?.first_name ?? "",
    lastName: row.school_memberships?.profiles?.last_name ?? "",
  }));
}

export async function assignClassLeadership(classId: string, schoolId: string, membershipId: string): Promise<void> {
  const { error } = await supabase
    .from("class_staff_assignments")
    .insert({ school_id: schoolId, class_id: classId, membership_id: membershipId });
  if (error) throw toCampusError(error, "Klassenleitung konnte nicht zugewiesen werden.");
}

export async function revokeClassLeadership(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from("class_staff_assignments")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", assignmentId);
  if (error) throw toCampusError(error, "Klassenleitung konnte nicht beendet werden.");
}

export interface RosterMember {
  classMembershipId: string;
  membershipId: string;
  firstName: string;
  lastName: string;
}

interface ClassMembershipRow {
  id: string;
  membership_id: string;
  school_memberships: { profiles: { first_name: string; last_name: string } | null } | null;
}

export async function listClassRoster(classId: string): Promise<RosterMember[]> {
  const { data, error } = await supabase
    .from("class_memberships")
    .select("id, membership_id, school_memberships(profiles(first_name, last_name))")
    .eq("class_id", classId)
    .is("ended_at", null)
    .returns<ClassMembershipRow[]>();
  if (error) throw toCampusError(error, "Klassenliste konnte nicht geladen werden.");
  return (data ?? []).map((row) => ({
    classMembershipId: row.id,
    membershipId: row.membership_id,
    firstName: row.school_memberships?.profiles?.first_name ?? "",
    lastName: row.school_memberships?.profiles?.last_name ?? "",
  }));
}

export async function addClassMember(classId: string, schoolId: string, membershipId: string): Promise<void> {
  const { error } = await supabase
    .from("class_memberships")
    .insert({ school_id: schoolId, class_id: classId, membership_id: membershipId });
  if (error) throw toCampusError(error, "Schüler konnte nicht zur Klasse hinzugefügt werden.");
}

export async function removeClassMember(classMembershipId: string): Promise<void> {
  const { error } = await supabase
    .from("class_memberships")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", classMembershipId);
  if (error) throw toCampusError(error, "Schüler konnte nicht aus der Klasse entfernt werden.");
}

// --- SCR-14/15: Fächer und Kurse ---------------------------------------

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export async function listSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase.from("subjects").select("id, name, code").order("name");
  if (error) throw toCampusError(error, "Fächer konnten nicht geladen werden.");
  return data ?? [];
}

export async function createSubject(name: string, code: string): Promise<void> {
  const schoolId = await resolveOwnSchoolId();
  const { error } = await supabase.from("subjects").insert({ school_id: schoolId, name, code });
  if (error) throw toCampusError(error, "Fach konnte nicht angelegt werden.");
}

export interface Course {
  id: string;
  name: string;
  subjectId: string;
  schoolYearId: string;
}

export async function listCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, subject_id, school_year_id")
    .order("name");
  if (error) throw toCampusError(error, "Kurse konnten nicht geladen werden.");
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    subjectId: row.subject_id,
    schoolYearId: row.school_year_id,
  }));
}

export async function createCourse(name: string, subjectId: string, schoolYearId: string): Promise<void> {
  const schoolId = await resolveOwnSchoolId();
  const { error } = await supabase
    .from("courses")
    .insert({ school_id: schoolId, name, subject_id: subjectId, school_year_id: schoolYearId });
  if (error) throw toCampusError(error, "Kurs konnte nicht angelegt werden.");
}

export interface CourseMember {
  id: string;
  firstName: string;
  lastName: string;
  participantRole: "student" | "teacher";
}

interface CourseMembershipRow {
  id: string;
  participant_role: "student" | "teacher";
  school_memberships: { profiles: { first_name: string; last_name: string } | null } | null;
}

// course_memberships has three FKs into school_memberships
// (membership_id alone, the composite membership_id+membership_school_id,
// and user_id+membership_id) — bare `school_memberships(...)` is
// ambiguous to PostgREST (300 Multiple Choices), so the embed needs
// the explicit single-column FK hint.
export async function listCourseMembers(courseId: string): Promise<CourseMember[]> {
  const { data, error } = await supabase
    .from("course_memberships")
    .select("id, participant_role, school_memberships!course_memberships_membership_id_fkey(profiles(first_name, last_name))")
    .eq("course_id", courseId)
    .returns<CourseMembershipRow[]>();
  if (error) throw toCampusError(error, "Kursmitglieder konnten nicht geladen werden.");
  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.school_memberships?.profiles?.first_name ?? "",
    lastName: row.school_memberships?.profiles?.last_name ?? "",
    participantRole: row.participant_role,
  }));
}

export async function addCourseMember(
  courseId: string,
  membershipId: string,
  userId: string,
  participantRole: "student" | "teacher",
): Promise<void> {
  const schoolId = await resolveOwnSchoolId();
  const { error } = await supabase.from("course_memberships").insert({
    school_id: schoolId,
    course_id: courseId,
    user_id: userId,
    membership_id: membershipId,
    membership_school_id: schoolId,
    participant_role: participantRole,
  });
  if (error) throw toCampusError(error, "Mitglied konnte nicht zum Kurs hinzugefügt werden.");
}

export async function removeCourseMember(courseMembershipId: string): Promise<void> {
  const { error } = await supabase.from("course_memberships").delete().eq("id", courseMembershipId);
  if (error) throw toCampusError(error, "Mitglied konnte nicht aus dem Kurs entfernt werden.");
}

// --- SCR-17: Audit -------------------------------------------------------

export interface AuditEvent {
  id: string;
  action: string;
  targetType: string;
  outcome: string;
  reason: string | null;
  occurredAt: string;
}

// audit_events has no client write grant at all (only
// fn_write_audit_event, called internally by the SECURITY DEFINER
// functions) — this is select-only, and RLS already restricts it to
// school_admin/principal of that row's school.
export async function listAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from("audit_events")
    .select("id, action, target_type, outcome, reason, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw toCampusError(error, "Auditliste konnte nicht geladen werden.");
  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.target_type,
    outcome: row.outcome,
    reason: row.reason,
    occurredAt: row.occurred_at,
  }));
}
