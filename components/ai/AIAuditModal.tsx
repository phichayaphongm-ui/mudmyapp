'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  ArrowRight, 
  Loader2,
  Trophy,
  ShieldCheck,
  Zap
} from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import type { AIAuditResult } from '@/lib/services/ai'

interface AIAuditModalProps {
  isOpen: boolean
  onClose: () => void
  loading: boolean
  result: AIAuditResult | null
}

export function AIAuditModal({ isOpen, onClose, loading, result }: AIAuditModalProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Platinum': return 'from-indigo-500 to-purple-600'
      case 'Gold': return 'from-amber-400 to-orange-500'
      case 'Silver': return 'from-slate-400 to-slate-600'
      default: return 'from-emerald-400 to-teal-500'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Platinum': return Trophy
      case 'Gold': return ShieldCheck
      case 'Silver': return Zap
      default: return Sparkles
    }
  }

  const Icon = result ? getLevelIcon(result.identitySyncLevel) : Sparkles

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-w-md mx-auto h-[90vh] bg-zinc-950 text-white border-white/10">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-white/20 mt-4 mb-2" />
        
        <DrawerHeader className="text-left px-6">
          <DrawerTitle className="text-xl font-black flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-primary" />
            AI IDENTITY AUDIT
          </DrawerTitle>
          <DrawerDescription className="text-zinc-400">
            วิเคราะห์ระดับความพร้อมของตัวตนคุณบนระบบ AI
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-10">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <Sparkles className="w-6 h-6 text-secondary absolute -right-2 -top-2 animate-pulse" />
                </div>
                <h3 className="mt-6 text-lg font-bold">กำลังประมวลผลข้อมูล...</h3>
                <p className="mt-2 text-sm text-zinc-400 px-10">
                  AI กำลังตรวจสอบโปรไฟล์และหมุดของคุณเพื่อประเมินความพร้อม
                </p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Score Card */}
                <div className={cn(
                  "rounded-3xl p-6 bg-gradient-to-br relative overflow-hidden",
                  getLevelColor(result.identitySyncLevel)
                )}>
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  
                  <div className="relative flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
                        Identity Sync Level
                      </div>
                      <div className="text-3xl font-black mt-1">
                        {result.identitySyncLevel}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black">{result.readinessScore}</div>
                      <div className="text-[10px] font-bold opacity-80">READINESS SCORE</div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3 bg-black/20 backdrop-blur-md rounded-2xl p-4">
                    <Icon className="w-8 h-8 text-white shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid gap-4">
                  {/* Strengths */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> จุดแข็งของคุณ
                    </h4>
                    <div className="grid gap-2">
                      {result.strengths.map((s, i) => (
                        <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 text-xs flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> จุดที่ควรปรับปรุง
                    </h4>
                    <div className="grid gap-2">
                      {result.weaknesses.map((w, i) => (
                        <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 text-xs flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          {w}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" /> คำแนะนำจาก AI
                    </h4>
                    <div className="grid gap-2">
                      {result.recommendations.map((r, i) => (
                        <div key={i} className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-xs font-medium flex items-start gap-3 text-primary-foreground/90">
                          <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <DrawerFooter className="px-6 pb-8">
          <button
            onClick={onClose}
            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-colors"
          >
            ตกลง เข้าใจแล้ว
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
