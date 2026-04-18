import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Logo Skynote' }

export default function LogoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-bg dark:bg-night-bg">
      <Image src="/skycoin.png" alt="Skynote Logo" width={512} height={512} priority />
    </div>
  )
}