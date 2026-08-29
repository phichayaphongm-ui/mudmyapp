import Link from 'next/link'
import { ArrowLeft, Compass, MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <MapPin className="h-10 w-10" />
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">ไม่พบหน้าที่คุณกำลังค้นหา</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          ลิงก์นี้อาจถูกย้าย ลบ หรือสะกดไม่ถูกต้อง ลองกลับไปเลือกดูหมุดหมายใกล้ตัวคุณ
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-105">
            <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
          </Link>
          <Link href="/explore" className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition hover:border-primary/40">
            <Compass className="h-4 w-4 text-primary" /> สำรวจหมุดหมาย
          </Link>
        </div>
      </div>
    </main>
  )
}
