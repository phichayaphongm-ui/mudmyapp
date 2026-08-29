'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

const DISMISSED_KEY = 'mudmy-login-promotion-dismissed'

export function LoginPromotionModal() {
  const [open, setOpen] = useState(false)
  const [doNotShowAgain, setDoNotShowAgain] = useState(false)

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISSED_KEY) === 'true'
    if (!dismissed) setOpen(true)
  }, [])

  const close = () => {
    if (doNotShowAgain) {
      window.localStorage.setItem(DISMISSED_KEY, 'true')
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(88vw,540px)] max-h-[95vh] gap-0 overflow-hidden rounded-[28px] border border-[#f0e0d2] bg-[#f8f5f2]/95 p-0 shadow-[0_30px_80px_rgba(97,62,31,0.18)] backdrop-blur-[1px] dark:border-slate-700 dark:bg-slate-900/95"
      >
        <DialogTitle className="sr-only">เริ่มต้นใช้งาน Mudmy</DialogTitle>
        <DialogDescription className="sr-only">
          แพลตฟอร์มรวมทุกเรื่องในชุมชน ค้นหาง่าย เชื่อมต่อทันที ใกล้ตัวคุณ
        </DialogDescription>

        <div className="relative max-h-[calc(95vh-78px)] overflow-y-auto bg-[#f7f3ee] dark:bg-slate-900">
          <Image
            src="/Promote.jpg"
            alt="เริ่มต้นใช้งาน Mudmy"
            width={815}
            height={1024}
            priority
            className="h-auto w-full object-contain"
          />
          <button
            type="button"
            onClick={close}
            aria-label="ปิดหน้าต่าง"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f6f0ea] text-slate-900 shadow-lg ring-1 ring-[#eadccf] backdrop-blur-sm transition hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#eadccf] bg-[#f3efe9] px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(event) => setDoNotShowAgain(event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            ไม่แสดงอีก
          </label>
          <button
            type="button"
            onClick={close}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600"
          >
            เริ่มใช้งาน
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
