import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  BriefcaseBusiness,
  HeartHandshake,
  MapPin,
  Megaphone,
  MessagesSquare,
  Store,
  UsersRound,
} from 'lucide-react'

const purposes = [
  {
    icon: Store,
    title: 'ชุมชนแห่งการขาย',
    description: 'ช่วยให้สินค้า ร้านค้า และบริการจากคนในพื้นที่ถูกค้นพบได้ง่ายขึ้น บนแผนที่ที่ทุกคนเข้าถึงได้',
  },
  {
    icon: BriefcaseBusiness,
    title: 'ส่งเสริมการมีงานทำ',
    description: 'เปิดพื้นที่ให้คนไทยนำเสนอความสามารถ งานบริการ และโอกาสในการประกอบอาชีพของตัวเอง',
  },
  {
    icon: HeartHandshake,
    title: 'ช่วยเหลือเกื้อกูลกัน',
    description: 'สนับสนุนการแบ่งปันความช่วยเหลือในชุมชน รวมถึงการแจ้งเหตุและการส่งต่อความหวังในเวลาที่จำเป็น',
  },
  {
    icon: Megaphone,
    title: 'ข่าวสารใกล้ตัว',
    description: 'ทำให้ข่าวสาร กิจกรรม และเรื่องสำคัญของชุมชนเดินทางถึงคนที่อยู่รอบตัวเราได้เร็วขึ้น',
  },
]

const faqs = [
  {
    question: 'Mudmy คืออะไร?',
    answer: 'Mudmy หรือแอปหมุดหมาย (หมุดหมายแอป) คือแพลตฟอร์มชุมชนไทยบนแผนที่สำหรับค้นหาสินค้า ร้านค้า งาน บริการ ข่าวสาร และความช่วยเหลือใกล้บ้าน',
  },
  {
    question: 'Mudmy เก็บค่าคอมมิชชั่นหรือไม่?',
    answer: 'Mudmy ตั้งใจไม่เก็บค่าคอมมิชชั่นจากการซื้อขายหรือการติดต่อกัน เพื่อช่วยให้ผู้ประกอบการไทยมีพื้นที่นำเสนอสินค้าและบริการอย่างเต็มที่',
  },
  {
    question: 'Mudmy ใช้ได้ที่ไหน?',
    answer: 'Mudmy สร้างขึ้นสำหรับชุมชนไทยและสามารถใช้ค้นหาหรือปักหมุดสินค้า บริการ งาน ข่าวสาร และโอกาสในพื้นที่ต่าง ๆ ทั่วประเทศไทย',
  },
]

export const metadata: Metadata = {
  title: 'แอปหมุดหมาย (Mudmy) | เกี่ยวกับเรา',
  description: 'ทำความรู้จักแอปหมุดหมาย (Mudmy) หรือหมุดหมายแอป แพลตฟอร์มชุมชนไทยบนแผนที่ที่ช่วยเชื่อมโยงสินค้า บริการ งาน ข่าวสาร และความช่วยเหลือใกล้บ้าน โดยไม่เก็บค่าคอมมิชชั่น',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'เกี่ยวกับเรา | หมุดหมาย Mudmy',
    description: 'เรื่องราวและความตั้งใจของ Mudmy แพลตฟอร์มชุมชนไทยบนแผนที่',
    images: ['/images/Image/Aboutme.jpg'],
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-orange-50 via-background to-amber-50/50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-white/70 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Link>

        <section className="relative mt-5 overflow-hidden rounded-[2rem] border border-orange-100 bg-white/80 p-6 shadow-[0_20px_60px_rgba(234,88,12,0.10)] backdrop-blur sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-primary shadow-sm">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">About Mudmy</p>
                  <p className="text-sm font-semibold text-muted-foreground">หมุดหมายของชุมชนไทย</p>
                </div>
              </div>

              <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                เราอยากให้คนใกล้กัน
                <span className="block text-primary">รู้จักกันมากขึ้น</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                แอปหมุดหมาย หรือ Mudmy เกิดจากความตั้งใจที่จะสร้างพื้นที่ออนไลน์ที่อบอุ่นและใช้งานได้จริงสำหรับคนไทย พื้นที่ที่คนตัวเล็ก ๆ ร้านค้าในชุมชน ผู้ให้บริการ และคนที่กำลังมองหาโอกาส สามารถพบกันได้อย่างเป็นธรรมชาติ
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-gradient-to-br from-orange-500 to-amber-500 p-6 text-white shadow-xl shadow-orange-200 sm:p-8">
              <MessagesSquare className="mb-5 h-9 w-9" />
              <p className="text-xl font-black leading-relaxed sm:text-2xl">
                “เราเชื่อว่าชุมชนที่ดี เริ่มจากการมองเห็นและรับฟังกัน”
              </p>
              <p className="mt-5 text-sm leading-7 text-white/85">
                ทุกหมุดหมายจึงไม่ได้เป็นเพียงข้อมูลบนแผนที่ แต่เป็นโอกาสเล็ก ๆ ที่ทำให้ผู้คนได้เริ่มต้นรู้จักและช่วยเหลือกัน
              </p>
            </div>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-[1.5rem] border border-white/70 shadow-lg shadow-orange-100">
            <img
              src="/images/Image/Aboutme.jpg"
              alt="ผู้คนในชุมชนช่วยเหลือและแบ่งปันกันผ่านหมุดหมาย Mudmy"
              className="h-auto w-full object-cover"
            />
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Why Mudmy</p>
            <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">สิ่งที่เราอยากร่วมสร้างไปกับคุณ</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Mudmy เป็นแอปของไทยที่ตั้งใจทำให้การค้นหา การแบ่งปัน และการเริ่มต้นโอกาสใหม่ ๆ เกิดขึ้นได้ใกล้บ้านมากกว่าเดิม
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {purposes.map((purpose) => {
              const Icon = purpose.icon
              return (
                <article key={purpose.title} className="rounded-3xl border border-orange-100/80 bg-white/75 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-foreground">{purpose.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{purpose.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/80 p-6 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <UsersRound className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">ไม่มีค่าคอมมิชชั่น เพื่อให้โอกาสอยู่กับคนไทย</h2>
              <p className="mt-3 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base">
                เราตั้งใจไม่เก็บค่าคอมมิชชั่นจากการซื้อขายหรือการติดต่อกันบนแพลตฟอร์ม เพื่อให้ผู้ประกอบการไทยมีพื้นที่นำเสนอสินค้าและบริการอย่างเต็มที่ รายได้และความสัมพันธ์จึงยังคงอยู่กับคนในชุมชนเป็นสำคัญ
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 overflow-hidden rounded-[2rem] border border-orange-100 bg-white/75 p-4 shadow-sm sm:grid-cols-[0.85fr_1.15fr] sm:items-center sm:p-6">
          <div className="overflow-hidden rounded-[1.5rem]">
            <img
              src="/images/Image/Aboutme2.jpg"
              alt="คนในชุมชนค้นหาสินค้าและโอกาสใกล้ตัวผ่าน Mudmy"
              className="aspect-square h-full w-full object-cover"
            />
          </div>
          <div className="px-2 py-3 sm:px-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Closer To Home</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-foreground sm:text-3xl">
              เทคโนโลยีที่ทำให้ความใกล้ตัวมีความหมาย
            </h2>
            <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
              เราอยากให้การค้นหาร้านค้า งานบริการ ข่าวสาร หรือความช่วยเหลือ ไม่ต้องเริ่มจากการเดินทางไกลเสมอไป แค่เปิดหมุดหมาย คุณอาจได้พบผู้คนและโอกาสดี ๆ ที่อยู่ใกล้กว่าที่คิด
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">คำถามที่พบบ่อย</p>
            <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">รู้จักหมุดหมายให้มากขึ้น</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-3xl border border-orange-100/80 bg-white/75 p-5 shadow-sm">
                <h3 className="font-black text-foreground">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-2 py-12 text-center sm:py-16">
          <p className="mx-auto max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            ขอบคุณที่เข้ามาเป็นส่วนหนึ่งของหมุดหมาย ทุกการใช้งาน ทุกการแบ่งปัน และทุกความช่วยเหลือของคุณ กำลังช่วยให้ชุมชนไทยมีพื้นที่ที่น่าอยู่ขึ้นทีละน้อย
          </p>
          <p className="mt-6 font-black text-primary">จากผู้พัฒนา Mudmy ด้วยความตั้งใจ</p>
          <Link href="/explore" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-orange-200 transition hover:brightness-105">
            <MapPin className="h-4 w-4" /> ไปดูหมุดหมายใกล้ตัว
          </Link>
        </section>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />
    </main>
  )
}
