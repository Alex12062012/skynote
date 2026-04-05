'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { deleteCourse } from '@/lib/supabase/course-actions'
import { useI18n } from '@/lib/i18n/context'

export function DeleteCourseButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    startTransition(async () => {
      await deleteCourse(courseId)
      router.push('/courses')
    })
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Trash2 className="h-4 w-4" />
        Supprimer
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Supprimer ce cours ?">
        <p className="mb-6 font-body text-[14px] text-text-secondary dark:text-text-dark-secondary">
          Tu vas supprimer <strong className="text-text-main dark:text-text-dark-main">«&nbsp;{courseTitle}&nbsp;»</strong> ainsi que toutes ses fiches et ses QCM. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="danger" className="flex-1" loading={isPending} onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </>
  )
}

