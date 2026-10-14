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
  const { data: membership, error: membershipError } = await supabase
    .from("school_memberships")
    .select("school_id")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();
  if (membershipError || !membership) throw toCampusError(membershipError, "Schule konnte nicht ermittelt werden.");

  const { error } = await supabase
    .from("school_years")
    .insert({ school_id: membership.school_id, name, starts_on: startsOn, ends_on: endsOn });
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
  const { data: membership, error: membershipError } = await supabase
    .from("school_memberships")
    .select("school_id")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();
  if (membershipError || !membership) throw toCampusError(membershipError, "Schule konnte nicht ermittelt werden.");

  const { error } = await supabase
    .from("classes")
    .insert({ school_id: membership.school_id, name, school_year_id: schoolYearId });
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
