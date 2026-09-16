'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Loader2, Check, X } from 'lucide-react'

/**
 * Message du jour (admin).
 *
 * Cet écran n'est pas une protection : la route /api/admin/messages revérifie
 * l'identité admin à chaque appel.
 *
 * TODO produit (décision ouverte) : fréquence d'affichage (une fois vs
 * répétable) et ciblage par segment. Version actuelle : une fois par
 * utilisateur, tous les utilisateurs, un seul message actif à la fois.
 */

type AdminMessage = {
  id: string
  content: string
  reward_type: 'sky_coins' | 'nova' | null
  reward_amount: number | null
  active: boolean
  created_at: string
  seen_count: number
  target_user_id: string | null
  target_label: string | null
  applied_type: 'sky_coins' | 'nova' | null
  applied_amount: number | null
}

const VIDE = { content: '', reward_type: '', reward_amount: '10', active: true }

export function AdminMessagesPanel() {
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [form, setForm] = useState({ ...VIDE })
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')

  async function charger() {
    setChargement(true)
    try {
      const r = await fetch('/api/admin/messages')
      const j = await r.json()
      setMessages(j.messages ?? [])
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { charger() }, [])

  async function creer(e: React.FormEvent) {
    e.preventDefault()
    setErreur(''); setSucces(''); setEnvoi(true)
    try {
      const r = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: form.content,
          reward_type: form.reward_type || null,
          reward_amount: form.reward_type ? Number(form.reward_amount) : null,
          active: form.active,
        }),
      })
      const j = await r.json()
      if (!r.ok) { setErreur(j.error ?? 'Erreur'); return }
      setSucces(form.active ? 'Message publié : chaque utilisateur le verra une fois.' : 'Message enregistré (inactif).')
      setForm({ ...VIDE })
      charger()
    } finally {
      setEnvoi(false)
    }
  }

  async function basculer(m: AdminMessage) {
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, active: !m.active }),
    })
    charger()
  }

  const champ = 'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-100 focus:border-blue-500 focus:outline-none'
  const label = 'block mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400'

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h2 className="mb-1 flex items-center gap-2 text-[15px] font-bold text-slate-100">
        <Megaphone className="h-4 w-4" aria-hidden />
        Message du jour
      </h2>
      <p className="mb-4 text-[12px] text-slate-400">
        Affiché une fois à chaque utilisateur, en popup, au chargement du tableau de bord. Un seul broadcast actif à la fois. Les messages ciblés (envoyés depuis la fiche d&apos;un utilisateur, avec un crédit) apparaissent aussi ci-dessous.
      </p>

      <form onSubmit={creer} className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={label} htmlFor="msg-content">Message</label>
          <textarea id="msg-content" required rows={4} maxLength={2000} className={champ}
            value={form.content} placeholder="Nouveauté : les QCM ont maintenant 5 questions par fiche…"
            onChange={e => setForm({ ...form, content: e.target.value })} />
        </div>

        <div>
          <label className={label} htmlFor="msg-reward-type">Récompense (optionnel)</label>
          <select id="msg-reward-type" className={champ} value={form.reward_type}
            onChange={e => setForm({ ...form, reward_type: e.target.value })}>
            <option value="">Aucune</option>
            <option value="sky_coins">Sky Coins</option>
            <option value="nova">Novas</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="msg-reward-amount">Montant</label>
          <input id="msg-reward-amount" type="number" min={1} max={100000} className={champ}
            disabled={!form.reward_type} value={form.reward_amount}
            onChange={e => setForm({ ...form, reward_amount: e.target.value })} />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-200">
            <input type="checkbox" checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })} />
            Publier immédiatement
          </label>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={envoi}
            className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-blue-600 px-4 text-[13px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {envoi && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Enregistrer
          </button>
        </div>

        {erreur && <p role="alert" className="sm:col-span-2 lg:col-span-4 text-[13px] text-red-400">{erreur}</p>}
        {succes && <p role="status" className="sm:col-span-2 lg:col-span-4 text-[13px] text-emerald-400">{succes}</p>}
      </form>

      {chargement ? (
        <p className="text-[13px] text-slate-400">Chargement…</p>
      ) : messages.length === 0 ? (
        <p className="text-[13px] text-slate-400">Aucun message pour l&apos;instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4">Message</th>
                <th className="py-2 pr-4">Cible</th>
                <th className="py-2 pr-4">Récompense</th>
                <th className="py-2 pr-4">Vu par</th>
                <th className="py-2 pr-4">Créé le</th>
                <th className="py-2 pr-4">État</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {messages.map(m => (
                <tr key={m.id} className="border-t border-slate-800 align-top">
                  <td className="max-w-md py-2.5 pr-4 text-slate-100">
                    <span className="line-clamp-3 whitespace-pre-wrap">{m.content}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-300">
                    {m.target_user_id
                      ? <span className="rounded-full bg-indigo-900/40 px-2 py-0.5 text-[11px] text-indigo-300">{m.target_label}</span>
                      : <span className="text-[11px] text-slate-500">Tous</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-300">
                    {m.reward_type
                      ? `${m.reward_amount} ${m.reward_type === 'nova' ? 'Novas' : 'Sky Coins'} (au clic OK)`
                      : m.applied_type
                        ? `${m.applied_amount! > 0 ? '+' : ''}${m.applied_amount} ${m.applied_type === 'nova' ? 'Novas' : 'Sky Coins'} (déjà crédité)`
                        : '—'}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-slate-300">{m.seen_count}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{new Date(m.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-2.5 pr-4">
                    {m.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] text-emerald-400">
                        <Check className="h-3 w-3" aria-hidden /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                        <X className="h-3 w-3" aria-hidden /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => basculer(m)}
                      className="rounded-lg border border-slate-700 px-2.5 py-1 text-[12px] text-slate-200 hover:border-blue-500 hover:text-white">
                      {m.active ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
