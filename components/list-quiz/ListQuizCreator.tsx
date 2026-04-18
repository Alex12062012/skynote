"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, Lightbulb } from "lucide-react"

type Pair = { q: string; a: string }

interface Props {
  userId: string
  isPremium: boolean
  weeklyCount: number
}

const MAX_FREE_WEEKLY = 1

export function ListQuizCreator({ isPremium, weeklyCount }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [pairs, setPairs] = useState<Pair[]>([
    { q: "", a: "" },
    { q: "", a: "" },
    { q: "", a: "" },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const lastRowRef = useRef<HTMLInputElement>(null)

  const locked = !isPremium && weeklyCount >= MAX_FREE_WEEKLY

  function updatePair(index: number, field: "q" | "a", value: string) {
    setPairs(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function addRow() {
    setPairs(prev => [...prev, { q: "", a: "" }])
    setTimeout(() => lastRowRef.current?.focus(), 50)
  }

  function removeRow(index: number) {
    if (pairs.length <= 2) return
    setPairs(prev => prev.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number, field: "q" | "a") {
    if (e.key === "Tab" && field === "a" && index === pairs.length - 1 && !e.shiftKey) {
      e.preventDefault()
      addRow()
    }
  }

  async function handleSave() {
    setError("")
    const clean = pairs.filter(p => p.q.trim() && p.a.trim())
    if (!title.trim()) { setError("Donne un titre a ton quiz."); return }
    if (clean.length < 2) { setError("Ajoute au moins 2 paires question / reponse."); return }

    setSaving(true)
    try {
      const res = await fetch("/api/list-quiz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), pairs: clean }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erreur inattendue."); return }
      router.push(`/list-quiz/${data.id}`)
    } catch {
      setError("Probleme de connexion. Reessaie.")
    } finally {
      setSaving(false)
    }
  }

  if (locked) {
    return (
      <div style={{ minHeight: "100vh", background: "#060D1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <Lock style={{ width: 40, height: 40, marginBottom: 16, color: "#F0F6FF", display: "block", marginLeft: "auto", marginRight: "auto" }} />
          <h2 style={{ color: "#F0F6FF", fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Limite hebdomadaire atteinte</h2>
          <p style={{ color: "#94A3B8", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Le plan gratuit permet 1 cours par semaine. Passe en Premium pour en creer autant que tu veux.
          </p>
          <Link href="/premium" style={{ display: "inline-block", background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", fontWeight: 600, fontSize: 14, padding: "12px 28px", borderRadius: 12, textDecoration: "none" }}>
            Voir le plan Premium
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#F0F6FF", padding: "32px 24px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/dashboard" style={{ color: "#60A5FA", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
            ← Retour
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Nouveau quiz liste</h1>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            Saisis tes paires question / reponse. Le questionnaire de 20 questions sera genere automatiquement, sans IA.
          </p>
        </div>

        {/* Titre du quiz */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Titre du quiz
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex : Capitales d'Europe"
            style={{
              width: "100%", boxSizing: "border-box", background: "#0D1B2E", border: "1px solid #1E3A5F",
              borderRadius: 10, color: "#F0F6FF", fontSize: 15, padding: "12px 14px", outline: "none",
            }}
          />
        </div>

        {/* En-tetes colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 4 }}>Question</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 4 }}>Reponse</span>
          <span />
        </div>

        {/* Lignes Q/R */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {pairs.map((pair, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={pair.q}
                onChange={e => updatePair(i, "q", e.target.value)}
                placeholder={`Question ${i + 1}`}
                style={{
                  background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: 8,
                  color: "#F0F6FF", fontSize: 14, padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box",
                }}
              />
              <input
                type="text"
                value={pair.a}
                onChange={e => updatePair(i, "a", e.target.value)}
                placeholder={`Reponse ${i + 1}`}
                ref={i === pairs.length - 1 ? lastRowRef : undefined}
                onKeyDown={e => handleKeyDown(e, i, "a")}
                style={{
                  background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: 8,
                  color: "#F0F6FF", fontSize: 14, padding: "10px 12px", outline: "none", width: "100%", boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => removeRow(i)}
                disabled={pairs.length <= 2}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: "1px solid #1E3A5F",
                  background: "transparent", color: pairs.length <= 2 ? "#1E3A5F" : "#64748B",
                  cursor: pairs.length <= 2 ? "default" : "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Ajouter une ligne */}
        <button
          onClick={addRow}
          style={{
            width: "100%", padding: "10px", borderRadius: 8, border: "1px dashed #1E3A5F",
            background: "transparent", color: "#60A5FA", fontSize: 13, cursor: "pointer",
            marginBottom: 28,
          }}
        >
          + Ajouter une paire
        </button>

        {/* Info */}
        <div style={{ background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Lightbulb style={{ width: 16, height: 16, color: "#FACC15", flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            Le questionnaire tirera 20 questions au hasard parmi tes paires, avec des mauvaises reponses generees depuis ta liste. Score parfait = <strong style={{ color: "#60A5FA" }}>+10 Sky Coins</strong>. Pas de limite de regeneration.
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <p style={{ color: "#F87171", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "rgba(248,113,113,0.08)", borderRadius: 8, border: "1px solid rgba(248,113,113,0.2)" }}>
            {error}
          </p>
        )}

        {/* Sauvegarder */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: saving ? "#1E3A5F" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
            color: "#fff", fontWeight: 600, fontSize: 15, cursor: saving ? "default" : "pointer",
            boxShadow: saving ? "none" : "0 4px 20px rgba(37,99,235,0.35)",
          }}
        >
          {saving ? "Enregistrement..." : "Creer le quiz →"}
        </button>
      </div>
    </div>
  )
}
