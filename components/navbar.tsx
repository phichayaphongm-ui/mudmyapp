'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useNotifications } from '@/contexts/notification-context'
import { useLanguage } from '@/contexts/language-context'
import { useTheme } from 'next-themes'
import { Bell, User, Menu, X, ChevronDown, LogOut, Settings, LayoutDashboard, Sparkles, Languages, Sun, Moon, BellOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { MessageBadge } from '@/components/message-badge'

export function Navbar({ className, isLoggedIn: _isLoggedIn }: { className?: string; isLoggedIn?: boolean }) {
  const { lang, setLang, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  const { user, signOut, loading, isBanned } = useAuth()
  const banStatus = isBanned()
  const { permission, isEnabled, toggleNotifications } = useNotifications()
  const router = useRouter()

  const NAV_LINKS = [
    { href: '/home', label: t('navbar.home') ?? 'Home' },
    { href: '/explore', label: t('navbar.explore') ?? 'สำรวจ' },
    { href: '/dashboard', label: t('navbar.myPins') ?? 'หมุดของฉัน' },
    { href: '/create-pin', label: t('navbar.createPin') ?? 'ปักหมุด' },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Failed to sign out', error)
    }
  }

  // Override the prop with real auth state if not loading
  const isAuth = !loading ? !!user : false;

  return (
    <>
      {isAuth && banStatus.banned && (
        <div className={cn(
          "w-full bg-red-600 text-white py-2.5 px-4 flex items-center justify-center gap-3 z-[60] fixed top-0 left-0 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl",
          banStatus.permanent ? "bg-zinc-950" : "bg-red-600"
        )}>
          <AlertCircle className="w-5 h-5 animate-pulse shrink-0" />
          <div className="text-center">
            <div className="text-sm font-bold flex items-center justify-center gap-2">
              {banStatus.permanent ? t('common.isPermanentlyBanned') : t('common.userBanned')}
              {!banStatus.permanent && banStatus.until && (
                <Badge variant="outline" className="text-white border-white/40 bg-white/10 ml-2">
                  {t('common.bannedUntil', { date: new Date(banStatus.until).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) })}
                </Badge>
              )}
            </div>
            <p className="text-[10px] opacity-90 font-medium tracking-wide mt-0.5">{t('common.banWarning')}</p>
          </div>
        </div>
      )}
      <header className={cn(
        'sticky top-4 z-50 w-[calc(100%-2rem)] mx-auto transition-all duration-500',
        isAuth && banStatus.banned && 'top-16 md:top-20',
        'glass rounded-3xl shadow-xl shadow-primary/5',
        'border border-white/20',
        className
      )}>
      <div className="px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="relative">
            <div className="w-24 h-10 sm:w-32 sm:h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-primary/10 group-hover:shadow-primary/25 transition-all duration-500 group-hover:scale-105 border border-primary/10 p-0.5">
              <img 
                src="/logo1.png" 
                alt="Mudmy Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white animate-pulse" />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-2xl p-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          {mounted ? (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-2xl w-9 h-9 sm:w-10 sm:h-10 p-0 transition-all duration-300",
                "bg-gradient-to-br from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20",
                "shadow-sm border border-primary/5"
              )}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
              <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10" />
          )}

          {isAuth && (
            <>
              <MessageBadge />
              <Button
                variant="ghost"
                size="sm"
                className="rounded-2xl w-9 h-9 p-0 hover:bg-muted/80 relative"
                onClick={toggleNotifications}
                title={isEnabled ? 'Disable Notifications' : 'Enable Notifications'}
              >
                {isEnabled && permission === 'granted' ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                {permission === 'default' && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </Button>
            </>
          )}

          {/* Language Switcher */}
          <div className="hidden sm:block">
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-2xl gap-2 font-bold text-xs uppercase hover:bg-muted/80">
                  <Languages className="w-4 h-4 text-primary" />
                  <span>{lang}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl p-1 animate-scale-in">
                <DropdownMenuItem 
                  onClick={() => setLang('th')}
                  className={cn("rounded-xl cursor-pointer gap-2", lang === 'th' && "bg-primary/10 text-primary font-bold")}
                >
                  <span className="w-5 text-center">TH</span> ภาษาไทย
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLang('en')}
                  className={cn("rounded-xl cursor-pointer gap-2", lang === 'en' && "bg-primary/10 text-primary font-bold")}
                >
                  <span className="w-5 text-center">EN</span> English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" className="rounded-2xl gap-2 font-bold text-xs uppercase hover:bg-muted/80">
              <Languages className="w-4 h-4 text-primary" />
              <span>{lang}</span>
            </Button>
          )}
          </div>

          {isAuth ? (
            <>
              {/* User Menu */}
              {mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 rounded-2xl pl-1.5 pr-2 hover:bg-muted/80"
                    >
                      <div className="relative">
                        <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                          <AvatarImage src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold">
                            {user?.name?.charAt(0) || t('navbar.user').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full border-2 border-card" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                        {user?.nickname || user?.name || t('navbar.user')}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 animate-scale-in">
                    <div className="px-3 py-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} />
                          <AvatarFallback>{user?.name?.charAt(0) || t('navbar.user').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold truncate">{user?.nickname || user?.name || t('navbar.user')}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <Badge className="text-[10px] bg-secondary/20 text-secondary border-secondary/30 gap-1 capitalize">
                          <Sparkles className="w-2.5 h-2.5" /> {user?.plan || 'General'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link href={`/profile/${user?.id}`} className="gap-2">
                        <User className="w-4 h-4" /> {t('navbar.viewProfile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link href="/profile/settings" className="gap-2">
                        <Settings className="w-4 h-4" /> {t('profile.settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link href="/dashboard" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" /> {t('navbar.myPins')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem 
                      className="gap-2 text-destructive cursor-pointer rounded-xl"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4" /> {t('navbar.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 rounded-2xl pl-1.5 pr-2 hover:bg-muted/80"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder`} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold">
                        U
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                    ...
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-2xl font-medium">
                  {t('navbar.login')}
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="sm" 
                  className="rounded-2xl bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 text-xs font-bold"
                >
                  {t('navbar.join')}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl px-4 py-4 animate-slide-up">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium rounded-2xl text-foreground hover:bg-muted/80 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/* Mobile-only: Language & Theme */}
          <div className="sm:hidden mt-3 pt-3 border-t border-border/50 flex items-center gap-2 px-4">
            <button
              onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-muted/50 hover:bg-muted transition-colors"
            >
              <Languages className="w-4 h-4 text-primary" />
              {lang === 'th' ? 'EN' : 'TH'}
            </button>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-muted/50 hover:bg-muted transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            )}
          </div>
          {!isAuth && (
            <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full rounded-2xl">{t('navbar.login')}</Button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary/90">
                  {t('navbar.register')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
      </header>
    </>
  )
}
