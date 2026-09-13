import Link from 'next/link'
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  CircleHelp,
  FileCheck2,
  Handshake,
  MapPin,
  MessageCircleWarning,
  Scale,
  ShieldCheck,
} from 'lucide-react'

const sections = [
  {
    number: '01',
    icon: MapPin,
    title: 'แพลตฟอร์มทำหน้าที่อะไร',
    children: (
      <>
        <p>หมุดหมาย (Mudmy) เป็นแพลตฟอร์มชุมชนบนแผนที่ที่ช่วยให้ผู้ใช้ค้นพบและเผยแพร่ข้อมูลเกี่ยวกับสินค้า ร้านค้า งาน บริการ ข่าวสาร และความช่วยเหลือใกล้บ้าน</p>
        <p className="mt-3">เนื้อหาบนแพลตฟอร์ม เช่น ชื่อหมุด รายละเอียด ราคา รูปภาพ พิกัด และช่องทางติดต่อ อาจถูกสร้างหรือส่งต่อโดยผู้ใช้ ผู้ประกอบการ หรือบุคคลอื่น หมุดหมายไม่ได้เป็นเจ้าของหรือผู้ให้บริการของรายการเหล่านั้นโดยอัตโนมัติ</p>
      </>
    ),
  },
  {
    number: '02',
    icon: Handshake,
    title: 'การติดต่อและการทำธุรกรรม',
    children: (
      <>
        <p>การซื้อขาย การว่าจ้าง การนัดหมาย การชำระเงิน และข้อตกลงใด ๆ เกิดขึ้นระหว่างคู่สัญญาโดยตรง ผู้ใช้แต่ละฝ่ายต้องตรวจสอบข้อมูลและตัดสินใจด้วยตนเอง</p>
        <ul className="mt-4 space-y-2.5">
          {['ตรวจสอบตัวตน รายละเอียดสินค้า ราคา เงื่อนไข และสถานที่ก่อนตกลง', 'หลีกเลี่ยงการโอนเงินล่วงหน้าเมื่อยังตรวจสอบคู่สัญญาไม่ได้', 'เก็บหลักฐานการสนทนา ใบเสร็จ และรายละเอียดการชำระเงินไว้', 'อย่าเปิดเผยรหัสผ่าน รหัส OTP หรือข้อมูลทางการเงินให้ผู้อื่น'].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'ความถูกต้องและความพร้อมใช้งาน',
    children: (
      <>
        <p>หมุดหมายพยายามดูแลระบบและตรวจสอบเนื้อหาตามความเหมาะสม แต่ไม่สามารถรับรองได้ว่าข้อมูลทุกส่วนจะถูกต้อง ครบถ้วน เป็นปัจจุบัน หรือเหมาะกับวัตถุประสงค์ของผู้ใช้ทุกกรณี</p>
        <p className="mt-3">ระบบอาจหยุดให้บริการ ช้าลง หรือมีข้อผิดพลาดจากการบำรุงรักษา ปัญหาเครือข่าย ผู้ให้บริการภายนอก หรือเหตุสุดวิสัย หมุดหมายจะพยายามแก้ไขตามสมควรเมื่อทราบปัญหา</p>
      </>
    ),
  },
  {
    number: '04',
    icon: Scale,
    title: 'ขอบเขตความรับผิดชอบ',
    children: (
      <p>เท่าที่กฎหมายอนุญาต หมุดหมายไม่รับผิดชอบต่อความเสียหายหรือข้อพิพาทที่เกิดจากข้อมูล การกระทำ การละเว้น การซื้อขาย หรือข้อตกลงระหว่างผู้ใช้ รวมถึงการสูญเสียที่เกิดจากการเชื่อถือข้อมูลบนแพลตฟอร์มโดยไม่ได้ตรวจสอบเพิ่มเติม</p>
    ),
  },
]

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50/70 via-background to-background px-4 py-5 sm:px-6 sm:py-10 lg:px-10">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-orange-100/80 bg-card shadow-[0_18px_60px_-28px_rgba(234,88,12,0.35)]">
        <div className="border-b border-border/70 px-5 pb-7 pt-5 sm:px-10 sm:pb-9 sm:pt-7">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700">
              <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
            </Link>
            <span className="hidden rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:inline-flex">ปรับปรุงล่าสุด: 13 กันยายน 2569</span>
          </div>

          <div className="mt-8 flex items-start gap-4 sm:mt-10">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
              <img src="/android-icon.png" alt="Mudmy" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Mudmy · สำคัญก่อนใช้งาน</p>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">ข้อจำกัดความรับผิดชอบ</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">อ่านข้อมูลนี้เพื่อทำความเข้าใจบทบาทของแพลตฟอร์มและใช้หมุดหมายอย่างรอบคอบ</p>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
              <p className="text-sm font-medium leading-7 text-orange-950">สรุปสั้น ๆ: หมุดหมายเป็นพื้นที่ให้ผู้คนพบกันและแบ่งปันข้อมูล ไม่ใช่คู่สัญญา ผู้ใช้ควรตรวจสอบรายละเอียดและความน่าเชื่อถือก่อนตัดสินใจทุกครั้ง</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-7 sm:px-10 sm:py-9">
          <div className="grid gap-4 sm:grid-cols-2">
            {sections.map(({ number, icon: Icon, title, children }) => (
              <section key={number} className="rounded-2xl border border-border/80 bg-background/70 p-5 sm:p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black tracking-widest text-orange-500">หัวข้อ {number}</span>
                    <h2 className="mt-0.5 text-base font-bold leading-6 text-foreground sm:text-lg">{title}</h2>
                  </div>
                </div>
                <div className="text-sm leading-7 text-muted-foreground">{children}</div>
              </section>
            ))}
          </div>

          <section className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Ban className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <h2 className="font-bold text-red-900">เนื้อหาที่ไม่ควรเผยแพร่</h2>
                <p className="mt-2 text-sm leading-7 text-red-900/75">ห้ามใช้แพลตฟอร์มเพื่อหลอกลวง ละเมิดสิทธิ เผยแพร่ข้อมูลเท็จ คุกคามผู้อื่น ซื้อขายสิ่งผิดกฎหมาย หรือสร้างความไม่ปลอดภัยแก่ชุมชน เนื้อหาที่เข้าข่ายอาจถูกซ่อน ลบ หรือระงับบัญชีตามความเหมาะสม</p>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-muted/45 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground"><FileCheck2 className="h-4 w-4 text-orange-600" />เมื่อพบข้อมูลผิดปกติ</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">อย่าโอนเงินหรือส่งข้อมูลสำคัญ แจ้งเจ้าของหมุดโดยตรงอย่างสุภาพ และใช้ช่องทางรายงานของแพลตฟอร์มเมื่อพบเนื้อหาที่น่าสงสัย</p>
            </div>
            <div className="rounded-2xl bg-muted/45 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground"><MessageCircleWarning className="h-4 w-4 text-orange-600" />เหตุฉุกเฉินและข้อพิพาท</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">หากเป็นเหตุฉุกเฉิน โปรดติดต่อหน่วยงานที่เกี่ยวข้องโดยตรง แพลตฟอร์มไม่ใช่หน่วยงานฉุกเฉินหรือผู้ไกล่เกลี่ยข้อพิพาท</p>
            </div>
          </div>

          <div className="mt-8 border-t border-border/70 pt-6 text-center text-xs leading-6 text-muted-foreground">
            การใช้งานหมุดหมายต่อไปถือว่าคุณรับทราบข้อจำกัดนี้แล้ว หากมีข้อสงสัยเกี่ยวกับเนื้อหาหรือการใช้งาน โปรดติดต่อทีมงานผ่านช่องทางที่ระบุไว้ในแพลตฟอร์ม
          </div>
        </div>
      </article>
    </main>
  )
}
