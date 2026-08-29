'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/70 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-black text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <span>หมุดหมาย <span className="text-primary">Mudmy</span></span>
          </Link>
          <p className="mt-2 max-w-md text-xs leading-relaxed">
            แพลตฟอร์มชุมชนบนแผนที่สำหรับค้นหาสินค้า บริการ และโอกาสใกล้ตัว
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 sm:items-end">
          <nav aria-label="ข้อมูลเว็บไซต์" className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
            <Link href="/disclaimer" className="transition-colors hover:text-primary">ข้อจำกัดความรับผิดชอบ</Link>
            <Link href="/privacy-policy" className="transition-colors hover:text-primary">นโยบายความเป็นส่วนตัว</Link>
          </nav>
          <a
            href="https://www.phichaya.com"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            aria-label="ผู้พัฒนา Phichaya HR Solutions"
          >
            <span>พัฒนาโดย</span>
            <span className="relative flex h-10 w-28 items-center justify-center overflow-hidden rounded-lg bg-white/80 px-2 shadow-sm ring-1 ring-border/50 transition group-hover:ring-primary/30">
              <img
                src="/phichaya-logo.png"
                alt="Phichaya HR Solutions"
                className="h-10 w-28 object-contain px-2"
              />
            </span>
          </a>
        </div>
      </div>
      <div className="mx-auto mt-6 w-full max-w-6xl border-t border-border/50 pt-4 text-[11px]">
        © {new Date().getFullYear()} Mudmy. สงวนสิทธิ์ทุกประการ
      </div>
    </footer>
  )
}
