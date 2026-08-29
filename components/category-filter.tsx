'use client'

import { 
  ShoppingBag, Wrench, Briefcase, Car, Sparkles,
  Home, AlertTriangle,
  Store, Fuel, Calendar, Newspaper, ChevronRight
} from 'lucide-react'
import { CATEGORIES, type PinCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Wrench,
  Store,
  Briefcase,
  Car,
  Home,
  Fuel,
  Calendar,
  Newspaper,
  AlertTriangle
}

const CATEGORY_SUBTITLES: Record<string, string> = {
  all: 'ดูหมุดทั้งหมด',
  sell: 'ลงขายเลย',
  service: 'หางาน/หาช่าง',
  marketplace: 'ร้านอาหาร & คาเฟ่',
  jobs: 'รับสมัครงาน',
  taxi: 'เรียกวิน & แท็กซี่',
  property: 'บ้านเช่า & ที่ดิน',
  fuel_ev: 'จุดชาร์จ EV',
  events: 'เทศกาล & กิจกรรม',
  news: 'ข่าวในพื้นที่',
  emergency: 'แจ้งเหตุด่วน 24 ชม.',
}

interface CategoryFilterProps {
  selected: PinCategory | 'all'
  onChange: (cat: PinCategory | 'all') => void
  className?: string
}

export function CategoryFilter({ selected, onChange, className }: CategoryFilterProps) {
  const { t } = useLanguage()

  return (
    <div className={cn('flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-hide py-1', className)}>
      {/* All button Card */}
      <button
        onClick={() => onChange('all')}
        className={cn(
          'flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-left shrink-0 transition-all duration-300 border group min-w-[130px]',
          selected === 'all'
            ? 'bg-gradient-to-r from-primary to-primary/80 text-white border-transparent shadow-lg shadow-primary/25 scale-[1.02]'
            : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-primary/40 hover:shadow-md'
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          selected === 'all' ? "bg-white/25 text-white" : "bg-primary/10 dark:bg-primary/20 text-primary"
        )}>
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <p className={cn("text-xs font-bold leading-tight", selected === 'all' ? "text-white" : "text-slate-800 dark:text-slate-100")}>
            ทั้งหมด
          </p>
          <p className={cn("text-[10px] leading-tight truncate", selected === 'all' ? "text-white/85" : "text-slate-400 dark:text-slate-400")}>
            ดูหมุดทั้งหมด
          </p>
        </div>
        <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 opacity-70 group-hover:translate-x-0.5 transition-transform", selected === 'all' ? "text-white" : "text-slate-400")} />
      </button>

      {/* Category Cards */}
      {CATEGORIES.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || ShoppingBag
        const isActive = selected === cat.id
        const subtitle = CATEGORY_SUBTITLES[cat.id] || t(`categories.${cat.id}`)
        
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              'flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-left shrink-0 transition-all duration-300 border group min-w-[130px]',
              isActive
                ? 'bg-gradient-to-r from-primary to-primary/80 text-white border-transparent shadow-lg shadow-primary/25 scale-[1.02]'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-primary/40 hover:shadow-md'
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
              isActive ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-primary"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className={cn("text-xs font-bold leading-tight", isActive ? "text-white" : "text-slate-800 dark:text-slate-100")}>
                {t(`categories.${cat.id}`)}
              </p>
              <p className={cn("text-[10px] leading-tight truncate", isActive ? "text-white/85" : "text-slate-400 dark:text-slate-400")}>
                {subtitle}
              </p>
            </div>
            <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 opacity-70 group-hover:translate-x-0.5 transition-transform", isActive ? "text-white" : "text-slate-400")} />
          </button>
        )
      })}
    </div>
  )
}

