'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Users, Trophy, BookOpen, Flame, ChevronRight, Copy, Check } from 'lucide-react'
import { createFamilleGroup, addChildAccount, removeChildAccount } from '@/lib/supabase/famille-actions'
import { cn } from '@/lib/utils'

interface FamilleManagerProps {
  parentId: string
  initialGroup: any
  initialChildren: any[]
}

const SUBJECT_EMOJIS: Record<string, string> = {
  'Mathématiques': '🧮', 'Français': '📝', 'Histoire': '🏛️', 'Géographie': '🌍',
  'SVT': '🌱', 'Physique': '⚗️', 'Chimie': '🧪', 'Anglais': '🇬🇧',
  'Espagnol': '🇪🇸', 'Philosophie': '🤔', 'Général': '📚',
}

const CHILD_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-emerald-400 to-emerald-600',
  'from-orange-400 to-orange-500',
  'from-pink-400 to-pink-600',
  'from-amber-400 to-amber-500',
]

export function FamilleManager({ parentId, initialGroup, initialChildren }: FamilleManagerProps) {
  const [group, setGroup] = useState(initialGroup)
  const [children, setChildren] = useState(initialChildren)
  const [isPending, startTransition] = useTransition()
  const [groupName, setGroupName] = useState('')
  const [childPseudo, setChildPseudo] = useState('')
  const [showAddChild, setShowAddChild] = useState(false)
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [newChildInfo, setNewChildInfo] = useState<{ pseudo: string; code: string } | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [familyCodeCopied, setFamilyCodeCopied] = useState(false)

  async function handleCreateGroup() {
    startTransition(async () => {
      const { groupId, familyCode, error } = await createFamilleGroup(groupName || 'Ma famille')
      if (!error && groupId) {
        setGroup({ id: groupId, family_code: familyCode, name: groupName || 'Ma famille' })
      }
    })
  }

  async function handleAddChild() {
    if (!childPseudo.trim() || !group) return
    startTransition(async () => {
      const { childId, accessCode, error } = await addChildAccount(group.id, childPseudo)
      if (!error && childId && accessCode) {
        setNewChildInfo({ pseudo: childPseudo, code: accessCode })
        setChildPseudo('')
        setShowAddChild(false)
        window.location.reload()
      }
    })
  }

  async function handleRemoveChild(childId: string) {
    if (!confirm('Supprimer ce compte enfant ?')) return
    startTransition(async () => {
      await removeChildAccount(childId)
      setChildren((prev: any[]) => prev.filter((c: any) => c.id !== childId))
      if (selectedChild?.id === childId) setSelectedChild(null)
    })
  }

  function copyCode(code: string, type: 'child' | 'family') {
    navigator.clipboard.writeText(code)
    if (type === 'child') { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000) }
    else { setFamilyCodeCopied(true); setTimeout(() => setFamilyCodeCopied(false), 2000) }
  }

  // === PAGE DE CRÉATION ===
  if (!group) {
    return (
      <div className="flex flex-col items-center gap-8 py-12">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-xl text-5xl">
          👨‍👩‍👧
        </div>
        <div className="text-center max-w-sm">
          <h2 className="font-display text-h2 text-text-main dark:text-text-dark-main mb-2">
            Créer votre espace familial
          </h2>
          <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Ajoutez jusqu'à 6 enfants et suivez leur progression scolaire.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <input
            placeholder="Nom de la famille (ex: Famille Dupont)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="h-12 w-full rounded-input border border-sky-border bg-sky-surface px-4 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 dark:border-night-border dark:bg-night-surface dark:text-text-dark-main transition-all"
          />
          <button onClick={handleCreateGroup} disabled={isPending}
            className="flex h-12 w-full items-center justify-center rounded-input bg-gradient-to-r from-purple-500 to-purple-600 font-body text-[15px] font-semibold text-white shadow-md hover:from-purple-600 hover:to-purple-700 disabled:opacity-60 transition-all">
            {isPending ? 'Création...' : '✨ Créer l\'espace familial'}
          </button>
        </div>
      </div>
    )
  }

  const selectedChildTalent = selectedChild?.talent ?? null

  return (
    <div className="space-y-6">

      {/* Header groupe avec code famille */}
      <div className="rounded-card border border-purple-200 bg-gradient-to-r from-purple-50 to-sky-50 p-5 dark:border-purple-900/30 dark:from-purple-950/20 dark:to-sky-950/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-[20px] font-bold text-text-main dark:text-text-dark-main">
              {group.name}
            </h2>
            <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary mt-0.5">
              {children.length}/6 enfants
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-input border border-purple-200 bg-white px-4 py-2.5 dark:border-purple-800/30 dark:bg-night-surface">
            <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">Code famille :</span>
            <span className="font-mono text-[16px] font-bold tracking-widest text-purple-600 dark:text-purple-400">{group.family_code}</span>
            <button onClick={() => copyCode(group.family_code, 'family')} className="text-text-tertiary hover:text-purple-600 transition-colors">
              {familyCodeCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Code enfant après création */}
      {newChildInfo && (
        <div className="rounded-card border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800/30 dark:bg-emerald-950/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-body text-[14px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                ✅ Compte créé pour {newChildInfo.pseudo} !
              </p>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                Code personnel : <span className="font-mono text-[20px] font-bold text-text-main dark:text-text-dark-main">{newChildInfo.code}</span>
              </p>
              <p className="font-body text-[11px] text-text-tertiary mt-1">⚠️ Note ce code — il ne sera plus affiché</p>
            </div>
            <button onClick={() => copyCode(newChildInfo.code, 'child')} className="flex items-center gap-1.5 rounded-input border border-emerald-300 bg-white px-3 py-1.5 font-body text-[12px] font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-night-surface dark:text-emerald-400">
              {codeCopied ? <><Check className="h-3.5 w-3.5" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Copier</>}
            </button>
          </div>
          <button onClick={() => setNewChildInfo(null)} className="mt-3 font-body text-[12px] text-text-tertiary hover:text-text-main dark:hover:text-text-dark-main">
            Fermer ×
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar enfants */}
        <div className="lg:col-span-1 space-y-3">
          <p className="font-body text-[12px] font-semibold uppercase tracking-wider text-text-tertiary dark:text-text-dark-tertiary px-1">
            Enfants
          </p>

          {children.map((child: any, index: number) => (
            <button key={child.id} onClick={() => setSelectedChild(child)}
              className={cn(
                'w-full flex items-center gap-3 rounded-card border p-4 text-left transition-all',
                selectedChild?.id === child.id
                  ? 'border-purple-400 bg-purple-50 dark:border-purple-600 dark:bg-purple-950/30 shadow-sm'
                  : 'border-sky-border bg-sky-surface hover:border-purple-200 hover:bg-purple-50/50 dark:border-night-border dark:bg-night-surface dark:hover:border-purple-800/50'
              )}>
              <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-[16px] font-bold text-white shadow-sm', CHILD_COLORS[index % CHILD_COLORS.length])}>
                {child.pseudo[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main truncate">{child.pseudo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-body text-[11px] text-orange-500">🔥 {child.streak_days}j</span>
                  <span className="font-body text-[11px] text-text-tertiary">·</span>
                  <span className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">{child.sky_coins} 🪙</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary flex-shrink-0" />
            </button>
          ))}

          {/* Ajouter enfant */}
          {children.length < 6 && (
            showAddChild ? (
              <div className="rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface space-y-3">
                <input
                  placeholder="Prénom de l'enfant"
                  value={childPseudo}
                  onChange={(e) => setChildPseudo(e.target.value)}
                  autoFocus
                  className="h-10 w-full rounded-input border border-sky-border bg-sky-bg px-3 font-body text-[14px] text-text-main placeholder:text-text-tertiary focus:border-purple-400 focus:outline-none dark:border-night-border dark:bg-night-bg dark:text-text-dark-main"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddChild} disabled={isPending || !childPseudo.trim()}
                    className="flex-1 h-9 rounded-input bg-purple-500 font-body text-[13px] font-semibold text-white hover:bg-purple-600 disabled:opacity-50 transition-colors">
                    {isPending ? '...' : 'Ajouter'}
                  </button>
                  <button onClick={() => setShowAddChild(false)}
                    className="h-9 px-4 rounded-input border border-sky-border font-body text-[13px] text-text-secondary hover:bg-sky-cloud dark:border-night-border transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddChild(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-purple-200 font-body text-[13px] font-medium text-purple-500 hover:border-purple-400 hover:bg-purple-50/50 dark:border-purple-900/40 dark:text-purple-400 dark:hover:border-purple-700 transition-all">
                <Plus className="h-4 w-4" /> Ajouter un enfant
              </button>
            )
          )}

          {children.length === 0 && !showAddChild && (
            <div className="rounded-card border border-dashed border-sky-border py-8 text-center dark:border-night-border">
              <Users className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                Aucun enfant ajouté
              </p>
            </div>
          )}
        </div>

        {/* Dashboard enfant sélectionné */}
        <div className="lg:col-span-2">
          {!selectedChild ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-card border-2 border-dashed border-sky-border dark:border-night-border gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/30 text-3xl">
                👆
              </div>
              <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
                Sélectionne un enfant pour voir ses statistiques
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header enfant */}
              <div className="flex items-center justify-between rounded-card border border-sky-border bg-sky-surface p-5 dark:border-night-border dark:bg-night-surface">
                <div className="flex items-center gap-4">
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-[22px] font-bold text-white shadow-md', CHILD_COLORS[children.findIndex((c: any) => c.id === selectedChild.id) % CHILD_COLORS.length])}>
                    {selectedChild.pseudo[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display text-h3 text-text-main dark:text-text-dark-main">{selectedChild.pseudo}</h3>
                    <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                      Code : <span className="font-mono font-bold">{selectedChild.access_code}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => handleRemoveChild(selectedChild.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-input text-text-tertiary hover:bg-error/10 hover:text-error transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Talent dominant */}
              {selectedChildTalent && (
                <div className="rounded-card border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 dark:border-amber-800/30 dark:from-amber-950/20 dark:to-yellow-950/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-2xl">
                      🏆
                    </div>
                    <div>
                      <p className="font-body text-[12px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Talent dominant
                      </p>
                      <p className="font-display text-[17px] font-bold text-text-main dark:text-text-dark-main">
                        {SUBJECT_EMOJIS[selectedChildTalent.subject] || '📚'} {selectedChild.pseudo} excelle en {selectedChildTalent.subject}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🔥', label: 'Streak', value: `${selectedChild.streak_days}j`, color: 'text-orange-500' },
                  { icon: '📚', label: 'Cours/sem', value: `${selectedChild.courses_this_week ?? 0}/3`, color: 'text-brand dark:text-brand-dark' },
                  { icon: '🪙', label: 'Sky Coins', value: selectedChild.sky_coins, color: 'text-amber-500' },
                ].map((s) => (
                  <div key={s.label} className="rounded-card border border-sky-border bg-sky-surface p-4 text-center dark:border-night-border dark:bg-night-surface">
                    <p className="text-2xl mb-1">{s.icon}</p>
                    <p className={cn('font-display text-[20px] font-bold leading-none', s.color)}>{s.value}</p>
                    <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Stats par matière */}
              {selectedChild.child_stats?.length > 0 ? (
                <div className="rounded-card border border-sky-border bg-sky-surface p-5 dark:border-night-border dark:bg-night-surface">
                  <h4 className="font-display text-[15px] font-bold text-text-main dark:text-text-dark-main mb-4">Par matière</h4>
                  <div className="space-y-3">
                    {selectedChild.child_stats.map((s: any) => {
                      const rate = s.qcm_count > 0 ? Math.round((s.qcm_perfect / s.qcm_count) * 100) : 0
                      return (
                        <div key={s.subject} className="flex items-center gap-3">
                          <span className="text-lg w-6 flex-shrink-0">{SUBJECT_EMOJIS[s.subject] || '📚'}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">{s.subject}</p>
                              <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">
                                {s.qcm_perfect}/{s.qcm_count} parfaits · <span className="font-semibold">{rate}%</span>
                              </p>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-pill bg-sky-cloud dark:bg-night-border">
                              <div className="h-full rounded-pill transition-all duration-500"
                                style={{
                                  width: `${rate}%`,
                                  background: rate >= 80 ? '#059669' : rate >= 60 ? '#2563EB' : '#D97706'
                                }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-card border border-dashed border-sky-border py-8 text-center dark:border-night-border">
                  <BookOpen className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                  <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
                    {selectedChild.pseudo} n'a pas encore de statistiques
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
