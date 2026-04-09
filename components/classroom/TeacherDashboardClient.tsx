'use client'

import { useState } from 'react'
import { BookOpen, Plus, Copy, Check, Users, ArrowLeft, ChevronRight, FolderOpen } from 'lucide-react'
import { CourseFolders } from './CourseFolders'
import { CreateFolderModal } from './CreateFolderModal'
import { CourseRanking } from './CourseRanking'
import { PaymentTab } from './PaymentTab'
import { AddTeacherForm } from './AddTeacherForm'
import { SettingsToggles } from './SettingsToggles'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  classroom: any
  folders: any[]
  students: any[]
  teachers: any[]
  settings: any
  siteUrl: string
  courses: any[]
  flashcardsByCourse: Record<string, number>
  attemptsByStudent: Record<string, any[]>
  activeTab?: string
}

export function TeacherDashboardClient({ classroom, folders, students, teachers, settings, siteUrl, courses, flashcardsByCourse, attemptsByStudent, activeTab = 'courses' }: Props) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  function copyToClipboard(text: string) {
    try { navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement('textarea'); ta.value = text
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(text); setTimeout(() => setCopied(null), 2000)
  }

  const loginUrl = `${siteUrl}/classroom-login`
  const selectedFolder = folders.find((f: any) => f.id === selectedFolderId)
  const folderCourses = courses.filter((c: any) => c.folder_id === selectedFolderId)
  const selectedCourse = courses.find((c: any) => c.id === selectedCourseId)

  // Calculer le classement pour un cours
  function getCourseRanking(courseId: string) {
    const totalQcm = flashcardsByCourse[courseId] || 0
    return students.map((s: any) => {
      const studentAttempts = attemptsByStudent[s.id] || []
      const courseAttempts = studentAttempts.filter((a: any) => a.course_id === courseId)
      // Grouper par flashcard_id, garder le meilleur score par QCM
      const byFlashcard = new Map<string, any>()
      for (const a of courseAttempts) {
        const existing = byFlashcard.get(a.flashcard_id)
        if (!existing || a.score / a.total > existing.score / existing.total) {
          byFlashcard.set(a.flashcard_id, a)
        }
      }
      const bestAttempts = [...byFlashcard.values()]
      const qcmCompleted = bestAttempts.length
      const avgScore = qcmCompleted > 0
        ? (bestAttempts.reduce((sum: number, a: any) => sum + (a.score / a.total) * 20, 0) / qcmCompleted)
        : 0
      const perfectCount = bestAttempts.filter((a: any) => a.perfect).length

      return {
        firstName: s.first_name,
        lastName: s.last_name,
        qcmCompleted,
        qcmTotal: totalQcm,
        avgScore,
        perfectCount,
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ============ ONGLET COURS ============ */}
      {activeTab === 'courses' && !selectedFolderId && !selectedCourseId && (
        <CourseFolders
          folders={folders.map((f: any) => ({
            id: f.id, name: f.name, color: f.color, is_default: f.is_default, courseCount: f.courseCount,
          }))}
          onSelectFolder={(id) => setSelectedFolderId(id)}
          onCreateFolder={() => setShowCreateFolder(true)}
          isTeacher={true}
        />
      )}

      {/* VUE DOSSIER : liste des cours */}
      {activeTab === 'courses' && selectedFolderId && !selectedCourseId && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setSelectedFolderId(null)}
            className="flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" /> Retour aux dossiers
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: (selectedFolder?.color || '#2563EB') + '20' }}>
                <FolderOpen className="h-5 w-5" style={{ color: selectedFolder?.color || '#2563EB' }} />
              </div>
              <div>
                <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">{selectedFolder?.name}</h2>
                <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">{folderCourses.length} cours</p>
              </div>
            </div>
            <a href={`/courses/new?folder=${selectedFolderId}&classroom=${classroom.id}`}>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Ajouter un cours</Button>
            </a>
          </div>

          {folderCourses.length === 0 ? (
            <div className="rounded-card border border-dashed border-sky-border py-12 text-center dark:border-night-border">
              <p className="text-3xl mb-2">{'\uD83D\uDCDA'}</p>
              <p className="font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">Aucun cours dans ce dossier</p>
              <a href={`/courses/new?folder=${selectedFolderId}&classroom=${classroom.id}`}>
                <Button className="mt-4 gap-2"><Plus className="h-4 w-4" /> Creer le premier cours</Button>
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {folderCourses.map((course: any) => {
                const qcmTotal = flashcardsByCourse[course.id] || 0
                return (
                  <button key={course.id} onClick={() => setSelectedCourseId(course.id)}
                    className="flex w-full items-center justify-between rounded-card border border-sky-border bg-sky-surface p-4 shadow-card transition-all hover:border-brand/30 hover:shadow-md dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-brand-dark/30 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[15px] font-semibold text-text-main dark:text-text-dark-main truncate">{course.title}</p>
                      <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary mt-0.5">
                        {qcmTotal} QCM {'\u00B7'} {course.status === 'ready' ? 'Pret' : course.status === 'processing' ? 'En cours...' : 'Erreur'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VUE COURS : classement des eleves */}
      {activeTab === 'courses' && selectedCourseId && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setSelectedCourseId(null)}
            className="flex items-center gap-2 font-body text-[14px] text-text-secondary hover:text-text-main dark:text-text-dark-secondary dark:hover:text-text-dark-main transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" /> Retour a {selectedFolder?.name}
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">{selectedCourse?.title}</h2>
              <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
                {flashcardsByCourse[selectedCourseId] || 0} QCM {'\u00B7'} {students.length} eleves
              </p>
            </div>
            <a href={`/courses/${selectedCourseId}`}>
              <Button variant="secondary" className="gap-2"><BookOpen className="h-4 w-4" /> Voir le cours</Button>
            </a>
          </div>

          <CourseRanking
            students={getCourseRanking(selectedCourseId)}
            qcmTotal={flashcardsByCourse[selectedCourseId] || 0}
          />
        </div>
      )}

      {/* ============ ONGLET CODE DE CLASSE ============ */}
      {showCreateFolder && (
        <CreateFolderModal
          classroomId={classroom.id}
          onClose={() => setShowCreateFolder(false)}
          onCreated={() => window.location.reload()}
        />
      )}

      {activeTab === 'classCode' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-card bg-brand-soft/30 border border-brand/10 p-5 dark:bg-brand-dark-soft/30 dark:border-brand-dark/10">
            <h3 className="font-display text-[15px] font-semibold text-brand dark:text-brand-dark mb-2">
              Comment les eleves accedent a la classe
            </h3>
            <div className="space-y-2 font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">
              <p>1. L&apos;eleve va sur <span className="font-medium text-brand dark:text-brand-dark">{loginUrl}</span></p>
              <p>2. Il tape son code personnel (voir colonne &quot;Code&quot; ci-dessous)</p>
              <p>3. Il accede directement aux cours et QCM de la classe</p>
            </div>
            <div className="mt-3 rounded-input bg-brand/5 border border-brand/10 px-3 py-2 dark:bg-brand-dark/5 dark:border-brand-dark/10">
              <p className="font-body text-[12px] text-brand dark:text-brand-dark font-medium mb-0.5">Format du code de connexion</p>
              <p className="font-body text-[12px] text-text-secondary dark:text-text-dark-secondary">
                1re lettre du prenom + nom de famille + code de classe
              </p>
              <p className="font-mono text-[12px] text-brand dark:text-brand-dark mt-1">
                Ex : Oscar Plouvier &rarr; <strong>oplouvier{classroom.class_code}</strong>
              </p>
            </div>
            <button onClick={() => copyToClipboard(loginUrl)}
              className="mt-3 flex items-center gap-2 rounded-input bg-brand/10 px-3 py-2 font-body text-[13px] font-medium text-brand hover:bg-brand/20 dark:bg-brand-dark/10 dark:text-brand-dark dark:hover:bg-brand-dark/20 transition-colors">
              {copied === loginUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === loginUrl ? 'Copie !' : 'Copier le lien de connexion'}
            </button>
          </div>

          <div className="rounded-card bg-sky-surface p-6 shadow-card dark:bg-night-surface">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft dark:bg-brand-dark-soft">
                  <Users className="h-5 w-5 text-brand dark:text-brand-dark" />
                </div>
                <div>
                  <h2 className="font-display text-[18px] font-semibold text-text-main dark:text-text-dark-main">Eleves</h2>
                  <p className="font-body text-[13px] text-text-secondary dark:text-text-dark-secondary">{students.length} eleve{students.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {students.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-input bg-sky-bg px-4 py-3 dark:bg-night-bg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-cloud text-[12px] font-bold text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary">
                      {s.first_name[0]}{s.last_name[0]}
                    </div>
                    <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">{s.first_name} {s.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[12px] text-brand dark:text-brand-dark">{s.login_code}</code>
                    <button onClick={() => copyToClipboard(s.login_code)}
                      className="rounded-input p-1.5 text-text-tertiary hover:bg-sky-cloud dark:hover:bg-night-border transition-colors">
                      {copied === s.login_code ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Professeurs */}
          <div className="rounded-card bg-sky-surface p-5 shadow-card dark:bg-night-surface">
            <h3 className="font-display text-[15px] font-semibold text-text-main dark:text-text-dark-main mb-3">Professeurs ({teachers.length})</h3>
            <div className="space-y-2 mb-4">
              {teachers.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between rounded-input bg-sky-bg px-4 py-2.5 dark:bg-night-bg">
                  <span className="font-body text-[14px] text-text-main dark:text-text-dark-main">
                    {(t as any).profiles?.full_name || (t as any).profiles?.email || 'Professeur'}
                  </span>
                  <span className={cn('font-body text-[11px] px-2 py-0.5 rounded-full',
                    t.role === 'owner' ? 'bg-brand/10 text-brand dark:bg-brand-dark/10 dark:text-brand-dark' : 'bg-sky-cloud text-text-tertiary dark:bg-night-border dark:text-text-dark-tertiary')}>
                    {t.role === 'owner' ? 'Createur' : 'Membre'}
                  </span>
                </div>
              ))}
            </div>
            <AddTeacherForm classroomId={classroom.id} />
          </div>

          {/* Parametres */}
          <div className="rounded-card bg-sky-surface p-5 shadow-card dark:bg-night-surface">
            <h3 className="font-display text-[15px] font-semibold text-text-main dark:text-text-dark-main mb-4">Parametres</h3>
            <SettingsToggles classroomId={classroom.id} initialSettings={settings} />
          </div>
        </div>
      )}

      {/* ============ ONGLET PAIEMENT ============ */}
      {activeTab === 'payment' && <PaymentTab />}
    </div>
  )
}