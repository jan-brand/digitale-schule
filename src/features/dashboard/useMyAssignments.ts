import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export interface CourseAssignment {
  id: string;
  courseName: string;
  subjectName: string;
  role: "student" | "teacher";
}

export interface ClassLeadership {
  id: string;
  className: string;
}

interface CourseMembershipRow {
  id: string;
  participant_role: "student" | "teacher";
  courses: { name: string; subjects: { name: string } | null } | null;
}

interface ClassStaffAssignmentRow {
  id: string;
  classes: { name: string } | null;
}

// W-03 "Meine Zuordnungen" (doc/UI_UX_SPECIFICATION.md §6.2): real
// course_memberships + class_staff_assignments rows, RLS-scoped to the
// caller's own user_id/membership_id. There is deliberately no
// student-to-class roster query here — that table doesn't exist yet
// (M5 part 2's documented gap); course enrollment is the only real
// "own assignment" data Foundation v0.1 actually has.
export function useMyAssignments(membershipId: string | undefined) {
  const { session } = useAuth();
  const [courses, setCourses] = useState<CourseAssignment[]>([]);
  const [classLeaderships, setClassLeaderships] = useState<ClassLeadership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      supabase
        .from("course_memberships")
        .select("id, participant_role, courses(name, subjects(name))")
        .eq("user_id", session.user.id)
        .returns<CourseMembershipRow[]>(),
      membershipId
        ? supabase
            .from("class_staff_assignments")
            .select("id, classes(name)")
            .eq("membership_id", membershipId)
            .is("ended_at", null)
            .returns<ClassStaffAssignmentRow[]>()
        : Promise.resolve({ data: [] as ClassStaffAssignmentRow[], error: null }),
    ])
      .then(([courseResult, leadershipResult]) => {
        if (cancelled) return;
        if (courseResult.error || leadershipResult.error) {
          setError("Zuordnungen konnten nicht geladen werden.");
          setLoading(false);
          return;
        }
        setCourses(
          (courseResult.data ?? []).map((row) => ({
            id: row.id,
            courseName: row.courses?.name ?? "",
            subjectName: row.courses?.subjects?.name ?? "",
            role: row.participant_role,
          })),
        );
        setClassLeaderships(
          (leadershipResult.data ?? []).map((row) => ({
            id: row.id,
            className: row.classes?.name ?? "",
          })),
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Zuordnungen konnten nicht geladen werden.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, membershipId]);

  return { courses, classLeaderships, loading, error };
}
