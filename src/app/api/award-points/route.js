import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Optional bridge endpoint: lets an external system (e.g. the GDG
// Admin Portal project, a Zapier/Make automation, or a manual curl
// call) award points here without a Supabase Auth session.
//
// Protected by a shared secret (WEBHOOK_SECRET env var) instead of
// login — set that variable in Vercel/`.env.local` to enable this
// route. If it's not set, the route refuses every request.
//
// Body: { secret, email, points, category, note }
// category must be one of: assignment | quiz | attendance_bonus | bonus
// Matches the student by email (set when adding them in Students & Points).
export async function POST(request) {
  const configuredSecret = process.env.WEBHOOK_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: "This bridge is disabled (no WEBHOOK_SECRET configured)." }, { status: 501 });
  }

  const body = await request.json();
  const { secret, email, points, category, note } = body;

  if (secret !== configuredSecret) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 403 });
  }
  if (!email || !points || !category) {
    return NextResponse.json({ error: "Missing email, points, or category." }, { status: 400 });
  }
  if (!["assignment", "quiz", "attendance_bonus", "bonus"].includes(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const { data: student, error: findError } = await supabaseAdmin
    .from("students")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  if (findError) return NextResponse.json({ error: findError.message }, { status: 400 });
  if (!student) return NextResponse.json({ error: `No student found with email ${email}.` }, { status: 404 });

  const { error: insertError } = await supabaseAdmin.from("point_transactions").insert({
    student_id: student.id,
    category,
    points: Number(points),
    note: note || "Awarded via external integration",
  });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ ok: true, student: student.full_name });
}
