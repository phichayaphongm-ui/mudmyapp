import Link from 'next/link'
import { ArrowLeft, CircleAlert } from 'lucide-react'

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <CircleAlert className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">ข้อจำกัดความรับผิดชอบ</h1>
        </div>
        <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>ข้อมูล หมุดหมาย สินค้า บริการ และประกาศต่าง ๆ บนแพลตฟอร์มมาจากผู้ใช้หรือผู้ประกอบการแต่ละราย หมุดหมายไม่ได้เป็นผู้ขายหรือผู้ให้บริการโดยตรง</p>
          <p>ผู้ใช้ควรตรวจสอบรายละเอียด ราคา สถานที่ และตัวตนของคู่สัญญาก่อนตัดสินใจซื้อขายหรือใช้บริการ การติดต่อและธุรกรรมระหว่างผู้ใช้เป็นความรับผิดชอบของคู่สัญญา</p>
          <p>เราอาจลบหรือระงับเนื้อหาที่ละเมิดกฎหมาย นโยบาย หรือสิทธิของผู้อื่น และพยายามดูแลความถูกต้องของระบบอย่างเหมาะสม แต่ไม่รับรองว่าข้อมูลหรือบริการจะพร้อมใช้งานตลอดเวลา</p>
        </div>
      </article>
    </main>
  )
}
