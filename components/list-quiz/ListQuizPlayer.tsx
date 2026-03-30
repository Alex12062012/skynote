"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Pair = { q: string; a: string }

interface Quiz {
  id: string
  title: string
  pairs: Pair[]
}

interface Props {
  quiz: Quiz
  userId: string
  currentCoins: number
}

interface Question {
  question: string
  correct: string
  choices: string[]
}

const QUESTION_COUNT = 20

function buildQuestions(pairs: Pair[]): Question[] {
  // Si moins de 4 paires, on ne peut pas generer 3 distracteurs distincts
  const allAnswers = pairs.map(p => p.a)

  // Melange Fisher-Yates
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // Echantillonner N questions depuis les paires (avec repetition si < 20 paires)
  const pool: Pair[] = []
  while (pool.length < QUESTION_COUNT) {
    pool.push(...shuffle(pairs))
  }
  const selected = pool.slice(0, QUESTION_COUNT)

  return selected.map(pair => {
    const distractors = shuffle(allAnswers.filter(a => a !== pair.a)).slice(0, 3)
    // Completer avec des variantes si pas assez de distracteurs
    while (distractors.length < 3) distractors.push("—")
    const choices = shuffle([pair.a, ...distractors])
    return { question: pair.q, correct: pair.a, choices }
  })
}

type Phase = "playing" | "result"

export function ListQuizPlayer({ quiz, userId, currentCoins }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(quiz.pairs))
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<Phase>("playing")
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const q = questions[current]
  const progress = ((current) / QUESTION_COUNT) * 100
  const isPerfect = score === QUESTION_COUNT

  function pick(choice: string) {
    if (selected !== null) return
    setSelected(choice)
    if (choice === q.correct) setScore(s => s + 1)
  }

  async function next() {
    if (current + 1 >= QUESTION_COUNT) {
      // Fin du quiz
      setSubmitting(true)
      try {
        const res = await fetch("/api/list-quiz/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, score: selected === q.correct ? score : score, total: QUESTION_COUNT }),
        })
        // Score final (la derniere reponse est deja comptee)
        const finalScore = selected === q.correct ? score : score
        const data = await res.json()
        setCoinsEarned(data.coinsEarned ?? 0)
      } catch {
        // On affiche quand meme les resultats
      } finally {
        setSubmitting(false)
        setPhase("result")
      }
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  const restart = useCallback(() => {
    setQuestions(buildQuestions(quiz.pairs))
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setPhase("playing")
    setCoinsEarned(0)
  }, [quiz.pairs])

  if (phase === "result") {
    return (
      <div style={{ minHeight: "100vh", background: "#060D1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <p style={{ fontSize: 56, marginBottom: 8 }}>{isPerfect ? "🏆" : score >= QUESTION_COUNT * 0.7 ? "👏" : "📚"}</p>
          <h2 style={{ color: "#F0F6FF", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
            {score} / {QUESTION_COUNT}
          </h2>
          <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
            {isPerfect ? "Score parfait !" : score >= QUESTION_COUNT * 0.7 ? "Bon resultat !" : "Continue a travailler."}
          </p>

          {coinsEarned > 0 && (
            <div style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 24 }}>
              <p style={{ color: "#60A5FA", fontSize: 15, fontWeight: 600, margin: 0 }}>
                +{coinsEarned} Sky Coins gagnés 🪙
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={restart}
              style={{
                padding: "13px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              Recommencer (nouveau tirage)
            </button>
            <Link href={`/list-quiz/${quiz.id}`} style={{ display: "block", padding: "13px", borderRadius: 12, border: "1px solid #1E3A5F", color: "#94A3B8", fontSize: 14, textDecoration: "none" }}>
              Modifier les paires
            </Link>
            <Link href="/dashboard" style={{ color: "#475569", fontSize: 13, textDecoration: "none", marginTop: 4 }}>
              ← Retour au dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060D1A", color: "#F0F6FF", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ maxWidth: 560, width: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 12, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
              {quiz.title}
            </p>
            <p style={{ fontSize: 13, color: "#64748B" }}>Question {current + 1} / {QUESTION_COUNT}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 13, color: "#60A5FA", fontWeight: 600 }}>{score} correct{score > 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{ height: 4, background: "#0D1B2E", borderRadius: 4, marginBottom: 32, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #2563EB, #60A5FA)", borderRadius: 4, transition: "width 0.3s ease" }} />
        </div>

        {/* Question */}
        <div style={{ background: "#0D1B2E", border: "1px solid #1E3A5F", borderRadius: 14, padding: "24px 20px", marginBottom: 20, textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#F0F6FF", lineHeight: 1.3 }}>{q.question}</p>
        </div>

        {/* Choix */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {q.choices.map((choice, i) => {
            const isSelected = selected === choice
            const isCorrect = choice === q.correct
            const revealed = selected !== null

            let borderColor = "#1E3A5F"
            let bg = "#0D1B2E"
            let color = "#CBD5E1"

            if (revealed) {
              if (isCorrect) { borderColor = "#22C55E"; bg = "rgba(34,197,94,0.08)"; color = "#86EFAC" }
              else if (isSelected) { borderColor = "#EF4444"; bg = "rgba(239,68,68,0.08)"; color = "#FCA5A5" }
            }

            return (
              <button
                key={i}
                onClick={() => pick(choice)}
                disabled={revealed}
                style={{
                  padding: "14px 12px", borderRadius: 10, border: `1px solid ${borderColor}`,
                  background: bg, color, fontSize: 14, fontWeight: 500,
                  cursor: revealed ? "default" : "pointer", textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                {choice}
              </button>
            )
          })}
        </div>

        {/* Bouton suivant */}
        {selected !== null && (
          <button
            onClick={next}
            disabled={submitting}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              color: "#fff", fontWeight: 600, fontSize: 15, cursor: submitting ? "default" : "pointer",
            }}
          >
            {current + 1 >= QUESTION_COUNT ? (submitting ? "Calcul en cours..." : "Voir les resultats") : "Question suivante →"}
          </button>
        )}
      </div>
    </div>
  )
}
