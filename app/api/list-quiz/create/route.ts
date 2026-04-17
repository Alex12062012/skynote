import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const body = await req.json()
  const { title, pairs } = body as { title: string; pairs: { q: string; a: string }[] }

  if (!title?.trim()) return NextResponse.json({ error: "Titre requis" }, { status: 400 })
  if (!Array.isArray(pairs) || pairs.length < 2) {
    return NextResponse.json({ error: "Minimum 2 paires requises" }, { status: 400 })
  }

  const clean = pairs
    .map(p => ({ q: p.q?.trim(), a: p.a?.trim() }))
    .filter(p => p.q && p.a)

  if (clean.length < 2) return NextResponse.json({ error: "Minimum 2 paires valides requises" }, { status: 400 })

  const { data, error } = await supabase
    .from("list_quizzes")
    .insert({ user_id: user.id, title: title.trim(), pairs: clean })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id })
}
