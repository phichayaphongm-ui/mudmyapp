import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">นโยบายความเป็นส่วนตัว</h1>
        </div>
        <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>หมุดหมายเก็บข้อมูลที่จำเป็นต่อการให้บริการ เช่น ข้อมูลบัญชี โปรไฟล์ หมุดหมาย รูปภาพ และข้อมูลการติดต่อที่คุณเลือกเผยแพร่</p>
          <p>เราใช้ข้อมูลเพื่อยืนยันตัวตน ให้บริการค้นหาและติดต่อสื่อสาร ดูแลความปลอดภัย ปรับปรุงระบบ และปฏิบัติตามกฎหมาย เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลอื่น</p>
          <p>ข้อมูลอาจถูกจัดเก็บและประมวลผลผ่าน Supabase ซึ่งเป็นผู้ให้บริการโครงสร้างพื้นฐานของระบบ โดยใช้มาตรการควบคุมการเข้าถึงตามความเหมาะสม</p>
          <p>คุณสามารถขอเข้าถึง แก้ไข หรือลบบัญชีและข้อมูลส่วนบุคคลได้ โดยติดต่อทีมงานหมุดหมาย การใช้บริการต่อหลังจากมีการปรับปรุงนโยบายถือว่าคุณรับทราบการเปลี่ยนแปลง</p>
        </div>
      </article>
    </main>
  )
}
