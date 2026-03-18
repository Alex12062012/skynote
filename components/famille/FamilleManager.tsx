'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Eye, Users, Trophy, Zap, BookOpen, Flame } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createFamilleGroup, addChildAccount, removeChildAccount } from '@/lib/supabase/famille-actions'
import { cn } from '@/lib/utils'

interface FamilleManagerProps {
  parentId: string
  initialGroup: any
  initialChildren: any[]
  calculateTalent: (stats: any[]) => { subject: string; score: number } | null
}

const SUBJECT_EMOJIS: Record<string, string> = {
  'Mathématiques': '🧮', 'Français': '📝', 'Histoire': '🏛️', 'Géographie': '🌍',
  'SVT': '🌱', 'Physique': '⚗️', 'Chimie': '🧪', 'Anglais': '🇬🇧',
  'Espagnol': '🇪🇸', 'Philosophie': '🤔', 'Général': '📚',
}

export function FamilleManager({ parentId, initialGroup, initialChildren, calculateTalent }: FamilleManagerProps) {
  const [group, setGroup] = useState(initialGroup)
  const [children, setChildren] = useState(initialChildren)
  const [isPending, startTransition] = useTransition()
  const [groupName, setGroupName] = useState('')
  const [childPseudo, setChildPseudo] = useState('')
  const [showAddChild, setShowAddChild] = useState(false)
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [newChildCode, setNewChildCode] = useState<{ pseudo: string; code: string } | null>(null)

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
        setNewChildCode({ pseudo: childPseudo, code: accessCode })
        setChildPseudo('')
        setShowAddChild(false)
        // Recharger
        window.location.reload()
      }
    })
  }

  async function handleRemoveChild(childId: string) {
    if (!confirm('Supprimer ce compte enfant ?')) return
    startTransition(async () => {
      await removeChildAccount(childId)
      setChildren(prev => prev.filter((c: any) => c.id !== childId))
      if (selectedChild?.id === childId) setSelectedChild(null)
    })
  }

  // Pas encore de groupe famille
  if (!group) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/30 text-4xl">
          👨‍👩‍👧
        </div>
        <div>
          <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">
            Créer votre espace familial
          </h2>
          <p className="mt-2 max-w-sm font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
            Donnez un nom à votre groupe famille et commencez à ajouter les comptes de vos enfants.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <Input
            label="Nom de la famille (optionnel)"
            placeholder="Ex: Famille Dupont"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Button onClick={handleCreateGroup} loading={isPending} size="lg" className="w-full">
            Créer l'espace familial
          </Button>
        </div>
      </div>
    )
  }

  const talent = selectedChild ? calculateTalent(selectedChild.child_stats || []) : null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Sidebar — liste des enfants */}
      <div className="lg:col-span-1">
        <div className="rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-[16px] font-bold text-text-main dark:text-text-dark-main">
                {group.name}
              </p>
              <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                Code famille : <strong className="font-mono text-brand dark:text-brand-dark">{group.family_code}</strong>
              </p>
            </div>
            <span className="font-body text-[12px] text-text-tertiary">{children.length}/6</span>
          </div>

          {/* Liste enfants */}
          <div className="space-y-2 mb-3">
            {children.map((child: any) => (
              <button key={child.id}
                onClick={() => setSelectedChild(child)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-input px-3 py-2.5 text-left transition-all',
                  selectedChild?.id === child.id
                    ? 'bg-brand-soft dark:bg-brand-dark-soft'
                    : 'hover:bg-sky-cloud dark:hover:bg-night-border'
                )}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/30 font-display text-[16px]">
                  {child.pseudo[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[14px] font-semibold text-text-main dark:text-text-dark-main truncate">
                    {child.pseudo}
                  </p>
                  <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">
                    Code : {child.access_code}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Ajouter enfant */}
          {children.length < 6 && (
            showAddChild ? (
              <div className="space-y-2">
                <Input placeholder="Prénom de l'enfant" value={childPseudo} onChange={(e) => setChildPseudo(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddChild} loading={isPending} className="flex-1">Ajouter</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddChild(false)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setShowAddChild(true)} className="w-full gap-2">
                <Plus className="h-4 w-4" /> Ajouter un enfant
              </Button>
            )
          )}
        </div>

        {/* Code affiché après création */}
        {newChildCode && (
          <div className="mt-3 rounded-card border border-success/30 bg-success-soft p-4 dark:border-emerald-800/30 dark:bg-emerald-950/20">
            <p className="font-body text-[13px] font-semibold text-success dark:text-success-dark mb-2">
              ✓ Compte créé pour {newChildCode.pseudo} !
            </p>
            <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">
              Code d'accès : <strong className="font-mono text-[18px] text-text-main dark:text-text-dark-main">{newChildCode.code}</strong>
            </p>
            <p className="font-body text-[11px] text-text-tertiary mt-1">Note ce code, il ne s'affichera plus.</p>
            <button onClick={() => setNewChildCode(null)} className="mt-2 font-body text-[12px] text-text-tertiary hover:text-text-main">Fermer ×</button>
          </div>
        )}
      </div>

      {/* Dashboard enfant sélectionné */}
      <div className="lg:col-span-2">
        {!selectedChild ? (
          <div className="flex h-full flex-col items-center justify-center rounded-card border border-dashed border-sky-border py-16 text-center dark:border-night-border">
            <Users className="h-12 w-12 text-text-tertiary dark:text-text-dark-tertiary mb-3" />
            <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
              Sélectionne un enfant pour voir ses statistiques
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header enfant */}
            <div className="flex items-center justify-between rounded-card border border-sky-border bg-sky-surface p-5 dark:border-night-border dark:bg-night-surface">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/30 font-display text-[24px] font-bold text-purple-600 dark:text-purple-400">
                  {selectedChild.pseudo[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-h3 text-text-main dark:text-text-dark-main">{selectedChild.pseudo}</h2>
                  <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
                    Code : <span className="font-mono">{selectedChild.access_code}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => handleRemoveChild(selectedChild.id)} className="text-error hover:bg-error/10 rounded-input p-2 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Talent dominant */}
            {talent && (
              <div className="rounded-card border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/30 dark:bg-amber-950/20">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <div>
                    <p className="font-body text-[12px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Talent dominant
                    </p>
                    <p className="font-display text-[18px] font-bold text-text-main dark:text-text-dark-main">
                      {SUBJECT_EMOJIS[talent.subject] || '📚'} {selectedChild.pseudo} excelle en {talent.subject}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats globales */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Flame className="h-5 w-5 text-orange-500" />, label: 'Streak', value: `${selectedChild.streak_days}j` },
                { icon: <BookOpen className="h-5 w-5 text-brand dark:text-brand-dark" />, label: 'Cours/semaine', value: `${selectedChild.courses_this_week}/3` },
                { icon: <span className="text-lg">🪙</span>, label: 'Sky Coins', value: selectedChild.sky_coins },
              ].map((s) => (
                <div key={s.label} className="rounded-card border border-sky-border bg-sky-surface p-4 text-center dark:border-night-border dark:bg-night-surface">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <p className="font-display text-[22px] font-bold text-text-main dark:text-text-dark-main">{s.value}</p>
                  <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Stats par matière */}
            {selectedChild.child_stats?.length > 0 && (
              <div className="rounded-card border border-sky-border bg-sky-surface p-5 dark:border-night-border dark:bg-night-surface">
                <h3 className="font-display text-h4 text-text-main dark:text-text-dark-main mb-4">Par matière</h3>
                <div className="space-y-3">
                  {selectedChild.child_stats.map((s: any) => {
                    const rate = s.qcm_count > 0 ? Math.round((s.qcm_perfect / s.qcm_count) * 100) : 0
                    return (
                      <div key={s.subject} className="flex items-center gap-3">
                        <span className="text-lg w-6">{SUBJECT_EMOJIS[s.subject] || '📚'}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-body text-[13px] font-medium text-text-main dark:text-text-dark-main">{s.subject}</p>
                            <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">
                              {s.qcm_perfect}/{s.qcm_count} QCM · {rate}%
                            </p>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-sky-cloud dark:bg-night-border">
                            <div className="h-full rounded-pill transition-all"
                              style={{ width: `${rate}%`, background: rate >= 80 ? '#059669' : rate >= 60 ? '#2563EB' : '#D97706' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(!selectedChild.child_stats || selectedChild.child_stats.length === 0) && (
              <div className="rounded-card border border-dashed border-sky-border py-8 text-center dark:border-night-border">
                <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
                  Pas encore de statistiques pour {selectedChild.pseudo}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
