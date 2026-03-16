import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function getInitials(nameOrEmail: string): string {
  if (nameOrEmail.includes('@')) return nameOrEmail.slice(0, 2).toUpperCase()
  return nameOrEmail.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
