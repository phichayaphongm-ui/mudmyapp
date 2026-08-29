'use client'

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Compass, Users, Search, Star, Rocket, Shield, Map as MapIcon, CheckCircle2, ArrowRight, ChevronLeft, Lock, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [heroImages] = useState<string[]>([
    '/images/Hero/Hero1.jpg',
    '/images/Hero/Hero2.jpg',
    '/images/Hero/Hero3.jpg',
    '/images/Hero/Hero4.jpg',
    '/images/Hero/Hero5.jpg'
  ]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPdpa, setShowPdpa] = useState(false);
  const [pdpaAccepted, setPdpaAccepted] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/home');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Initial loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    // Rotate images every 5 seconds
    const rotationInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(rotationInterval);
    };
  }, [heroImages.length]);

  const nextPage = () => {
    if (currentPage === 3) {
      setShowPdpa(true);
    } else {
      setCurrentPage((prev) => Math.min(prev + 1, 3));
    }
  };
  
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleStart = () => {
    if (pdpaAccepted) {
      router.push('/login');
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 1:
        return (
          <motion.div
            key="page1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col justify-between h-full"
          >
            <div className="text-center pt-8">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="flex items-center justify-center gap-4 mb-4"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/20 border border-orange-100 p-1">
                  <img src="/logo1.png" alt="Mudmy Logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-left">
                  <h1 className="text-5xl font-black tracking-tighter text-white leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Mudmy
                  </h1>
                </div>
              </motion.div>
              <p className="text-lg text-zinc-100 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {t('landing.tagline')}
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-orange-500/5 rounded-full blur-[120px] animate-pulse" />
              </div>
              
              {/* Floating UI */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="fixed bottom-56 left-6 glass-dark p-2 rounded-xl flex items-center gap-3 shadow-xl z-30 scale-75 origin-left"
              >
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-400 w-4 h-4" />
                </div>
                <div className="text-[10px] text-white">
                  <div className="text-zinc-500 font-medium">{t('landing.nearby')}</div>
                  <div className="font-bold">{t('landing.connected', { count: 128 })}</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="fixed bottom-40 right-6 glass-dark p-2 rounded-xl flex items-center gap-3 shadow-xl z-30 scale-75 origin-right"
              >
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Compass className="text-orange-400 w-4 h-4" />
                </div>
                <div className="text-[10px] text-white">
                  <div className="text-zinc-500 font-medium">{t('landing.discover')}</div>
                  <div className="font-bold">{t('landing.newOpportunities')}</div>
                </div>
              </motion.div>
            </div>

            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold text-white leading-tight px-4 whitespace-pre-line drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {t('landing.heroTitle')}
              </h2>
              <div className="h-1 w-12 bg-orange-500 mx-auto rounded-full shadow-lg" />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="page2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col h-full"
          >
            <div className="pt-8 mb-10">
              <span className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-2 block">Benefits</span>
              <h2 className="text-4xl font-bold text-white mb-4">{t('landing.benefits.title')}</h2>
              <p className="text-zinc-400 font-light">{t('landing.benefits.subtitle')}</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {[
                { icon: Star, ...(t('landing.benefits.items') as any)[0], color: "text-yellow-400" },
                { icon: Rocket, ...(t('landing.benefits.items') as any)[1], color: "text-orange-400" },
                { icon: Shield, ...(t('landing.benefits.items') as any)[2], color: "text-emerald-400" },
                { icon: Users, ...(t('landing.benefits.items') as any)[3], color: "text-blue-400" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-dark p-5 rounded-[2rem] flex items-center gap-5 hover:bg-white/10 transition-all cursor-default group"
                >
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <item.icon className={`${item.color} w-7 h-7`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-zinc-500 leading-snug">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="page3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col h-full"
          >
            <div className="pt-8 mb-10">
              <span className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-2 block">Guide</span>
              <h2 className="text-4xl font-bold text-white mb-4">{t('landing.guide.title')}</h2>
              <p className="text-zinc-400 font-light">{t('landing.guide.subtitle')}</p>
            </div>

            <div className="flex-1 space-y-10">
              {[
                { step: "01", icon: MapIcon, ...(t('landing.guide.steps') as any)[0], color: "bg-blue-500" },
                { step: "02", icon: Search, ...(t('landing.guide.steps') as any)[1], color: "bg-orange-500" },
                { step: "03", icon: CheckCircle2, ...(t('landing.guide.steps') as any)[2], color: "bg-emerald-500" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="relative flex gap-6"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center z-10 shadow-lg`}>
                      <item.icon className="text-white w-6 h-6" />
                    </div>
                    {i < 2 && (
                      <div className="w-0.5 h-full bg-gradient-to-b from-white/20 to-transparent mt-2" />
                    )}
                  </div>
                  <div className="pt-1">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Step {item.step}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] font-sans text-white">
      {/* Background Image - Fixed */}
      <div className="fixed inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img
              src={heroImages[currentImageIndex]}
              alt={`Pukmud Hero ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
        {/* Completely clear as requested, no dark gradient or blur */}
      </div>

      {/* UI Overlay - Scrollable Content */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col p-8 pb-10">
        {/* Navigation Controls */}
        <div className="flex justify-between items-center mb-6 shrink-0 mt-8">
          {currentPage > 1 ? (
            <button 
              onClick={prevPage}
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
          ) : <div className="w-11" />}
          
          <div className="flex gap-1.5">
            {[1, 2, 3].map((p) => (
              <div 
                key={p}
                className={`h-1 rounded-full transition-all duration-500 ${
                  currentPage === p ? 'w-10 bg-orange-500' : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>
          
          <div className="w-11">
             <button 
              onClick={() => router.push('/login')}
              className="text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase whitespace-nowrap"
            >
              {t('navbar.login')}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {renderPageContent()}
          </AnimatePresence>
        </div>

        {/* Bottom CTA Area */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-10 space-y-6 shrink-0"
        >
          <button 
            onClick={nextPage}
            className={cn(
              "w-full py-5 font-bold rounded-[2rem] transition-all flex items-center justify-center gap-3 group relative overflow-hidden",
              currentPage === 3 
                ? "fancy-button fancy-button-shimmer-auto fancy-button-glow text-white shadow-orange-500/25" 
                : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            )}
          >
            <span className="relative z-10">
              {currentPage === 3 ? t('landing.enterApp') : t('landing.next')}
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
          </button>
          
          <div className="flex justify-center items-center gap-8">
            <button onClick={() => router.push('/explore')} className="text-zinc-500 hover:text-white transition-colors text-xs font-medium uppercase tracking-widest flex items-center gap-2">
              <MapIcon className="w-4 h-4" /> {t('landing.viewMap')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* PDPA Modal */}
      <AnimatePresence>
        {showPdpa && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md glass-dark rounded-[3rem] p-8 shadow-2xl"
            >
              <div className="w-16 h-1 bg-white/10 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                  <Lock className="text-orange-500 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t('landing.pdpa.title')}</h3>
                  <p className="text-xs text-zinc-500">{t('landing.pdpa.subtitle')}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8 max-h-[30vh] overflow-y-auto pr-2 text-sm text-zinc-400 leading-relaxed font-light">
                <p>{t('landing.pdpa.intro')}</p>
                <ul className="list-disc pl-5 space-y-2">
                  {(t('landing.pdpa.bullets') as any).map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <p>{t('landing.pdpa.withdrawal')}</p>
                <p>{t('landing.pdpa.acceptance')}</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setPdpaAccepted(!pdpaAccepted)}
                  className="flex items-center gap-3 w-full group"
                >
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    pdpaAccepted ? 'bg-orange-500 border-orange-500' : 'border-white/20 group-hover:border-white/40'
                  }`}>
                    {pdpaAccepted && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-sm transition-colors ${pdpaAccepted ? 'text-white' : 'text-zinc-500'}`}>
                    {t('landing.pdpa.checkbox')}
                  </span>
                </button>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowPdpa(false)}
                    className="flex-1 py-4 bg-white/5 text-zinc-400 font-bold rounded-2xl hover:bg-white/10 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    disabled={!pdpaAccepted}
                    onClick={handleStart}
                    className={`flex-[2] py-4 font-bold rounded-2xl transition-all ${
                      pdpaAccepted 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' 
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {t('landing.pdpa.acceptBtn')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
            <MapPin className="absolute inset-0 m-auto text-orange-500 w-6 h-6 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg tracking-widest uppercase mb-1">Mudmy</p>
            <p className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase mb-1">Marketplace</p>
            <p className="text-zinc-500 text-xs font-medium">{t('landing.loading')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
