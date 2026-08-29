'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  X, Sparkles, MapPin, Users, 
  ArrowRight, ShieldCheck, Zap 
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { t } = useLanguage()

  const features = [
    {
      icon: MapPin,
      title: t('landing.benefits.items.0.title'),
      desc: t('landing.benefits.items.0.desc'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Zap,
      title: t('landing.benefits.items.1.title'),
      desc: t('landing.benefits.items.1.desc'),
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      icon: ShieldCheck,
      title: t('landing.benefits.items.2.title'),
      desc: t('landing.benefits.items.2.desc'),
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      icon: Users,
      title: t('landing.benefits.items.3.title'),
      desc: t('landing.benefits.items.3.desc'),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <VisuallyHidden>
          <DialogTitle>{t('landing.benefits.title')}</DialogTitle>
          <DialogDescription>{t('landing.benefits.subtitle')}</DialogDescription>
        </VisuallyHidden>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
        >
          {/* Decorative Header */}
          <div className="relative h-32 bg-gradient-to-br from-primary via-orange-500 to-secondary flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-black rounded-full blur-3xl" />
            </div>
            
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl mb-2">
                <Sparkles className="w-8 h-8 text-white animate-bounce" />
              </div>
            </motion.div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 backdrop-blur-md rounded-full transition-all text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pt-6 pb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black tracking-tight text-foreground leading-tight">
                {t('landing.benefits.title')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {t('landing.benefits.subtitle')}
              </p>
            </div>

            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex items-start gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors group"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", f.bg)}>
                    <f.icon className={cn("w-5 h-5", f.color)} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground leading-none mb-1">{f.title}</span>
                    <span className="text-xs text-muted-foreground leading-tight">{f.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <Button
                onClick={onClose}
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-base gap-3 transition-all",
                  "fancy-button fancy-button-shimmer-auto fancy-button-glow",
                  "text-white"
                )}
              >
                {t('landing.enterApp')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <p className="text-[10px] text-center text-muted-foreground mt-4 px-4 leading-relaxed opacity-70">
                {t('landing.pdpa.intro')} {t('landing.pdpa.acceptance')}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
