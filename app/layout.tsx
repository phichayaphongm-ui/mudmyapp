import type { Metadata, Viewport } from 'next'
import { Kanit, Prompt } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { NotificationProvider } from '@/contexts/notification-context'
import { Toaster } from 'sonner'
import { LanguageProvider } from '@/contexts/language-context'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeColorProvider } from '@/contexts/theme-color-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { ConnectionStatus } from '@/components/connection-status'
import { IncomingChatAlerts } from '@/components/incoming-chat-alerts'
import { SiteFooter } from '@/components/site-footer'
import './main.css'

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-kanit',
})

const prompt = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-prompt',
})

// Strip BOM (﻿) and whitespace that may appear in Vercel env vars
const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/^\uFEFF/, '').trim()

export const metadata: Metadata = {
  metadataBase: new URL(
    rawAppUrl && !rawAppUrl.includes('localhost')
      ? rawAppUrl
      : 'https://mudmy.app'
  ),
  title: {
    default: 'แอปหมุดหมาย (Mudmy) | ตลาดชุมชนไทยบนแผนที่',
    template: '%s | หมุดหมาย Mudmy',
  },
  description: 'แอปหมุดหมาย (Mudmy) คือแพลตฟอร์มชุมชนไทยบนแผนที่สำหรับค้นหาสินค้า ร้านค้า งาน บริการ ข่าวสาร และความช่วยเหลือใกล้บ้าน พร้อมปักหมุดให้คนในพื้นที่ค้นพบ',
  keywords: [
    'หมุดหมาย',
    'แอปหมุดหมาย',
    'หมุดหมายแอป',
    'Mudmy',
    'ตลาดชุมชน',
    'ตลาดออนไลน์ใกล้บ้าน',
    'ชุมชนออนไลน์ไทย',
    'ข่าวสารชุมชน',
    'หางานใกล้บ้าน',
    'บริการใกล้ฉัน',
    'ค้นหาสินค้าใกล้ฉัน',
    'ค้นหาบริการใกล้บ้าน',
    'ปักหมุดธุรกิจ',
    'ร้านค้าใกล้ฉัน',
    'งานในชุมชน',
  ],
  authors: [{ name: 'Phichaya HR Solutions', url: 'https://www.phichaya.com' }],
  creator: 'Phichaya HR Solutions',
  publisher: 'Phichaya HR Solutions',
  verification: {
    google: '1fmIzR3QDjMY95EhBGGHTuXrrvW0UPbxIYIrpAPK9Us',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'หมุดหมาย (Mudmy) | ตลาดชุมชนบนแผนที่',
    description: 'แอปหมุดหมายสำหรับค้นหาสินค้า บริการ ร้านค้า งาน และโอกาสใกล้บ้านบนแผนที่เดียว พร้อมปักหมุดให้ชุมชนค้นพบคุณ',
    locale: 'th_TH',
    type: 'website',
    siteName: 'หมุดหมาย (Mudmy)',
    images: [{ url: '/landingapp.jpg', width: 1536, height: 1024, alt: 'หมุดหมาย Mudmy ชุมชนไทยบนแผนที่' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'หมุดหมาย (Mudmy) | ตลาดชุมชนบนแผนที่',
    description: 'แอปหมุดหมายสำหรับค้นหาสินค้า บริการ และโอกาสใกล้บ้าน พร้อมปักหมุดธุรกิจของคุณให้คนในพื้นที่ค้นพบ',
    images: ['/landingapp.jpg'],
  },
  icons: {
    icon: [
      { url: '/android-icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/android-icon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'หมุดหมาย',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF7E36',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${kanit.variable} ${prompt.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Script
          id="console-error-filter"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var isNoise=function(args){try{var label=typeof args[0]==='string'?args[0]:'';var err=(args[1] instanceof Error?args[1]:(args[0] instanceof Error?args[0]:null));return label.indexOf('[getThemeColors]')!==-1&&err&&typeof err.message==='string'&&err.message.indexOf('exportedColors')!==-1}catch(e){return false}};var wrap=function(fn){if(typeof fn!=='function')return fn;if(fn&&fn.__mudmyFiltered)return fn;var wrapped=function(){var args=Array.prototype.slice.call(arguments);if(isNoise(args))return;return fn.apply(this,args)};try{Object.defineProperty(wrapped,'__mudmyFiltered',{value:true})}catch(e){};return wrapped};var desc=Object.getOwnPropertyDescriptor(console,'error');if(!desc||desc.configurable){var current=wrap(console.error);Object.defineProperty(console,'error',{configurable:true,get:function(){return current},set:function(fn){current=wrap(fn)}});console.error=current}}catch(e){}})();",
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <AuthProvider>
              <ThemeColorProvider>
                <NotificationProvider>
                  <LanguageProvider>
                    <ConnectionStatus />
                    <IncomingChatAlerts />
                    {children}
                    <SiteFooter />
                    <Toaster position="top-center" richColors />
                  </LanguageProvider>
                </NotificationProvider>
              </ThemeColorProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
        <Script
          id="mudmy-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: 'หมุดหมาย (Mudmy)',
                url: 'https://mudmy.app',
                description: 'แอปหมุดหมาย หรือหมุดหมายแอป เป็นแพลตฟอร์มชุมชนไทยบนแผนที่สำหรับค้นหาสินค้า บริการ ร้านค้า งาน ข่าวสาร และความช่วยเหลือใกล้บ้าน',
                applicationCategory: 'Marketplace',
                operatingSystem: 'Web',
                inLanguage: 'th-TH',
                areaServed: { '@type': 'Country', name: 'Thailand' },
                creator: {
                  '@type': 'Organization',
                  name: 'Phichaya HR Solutions',
                  url: 'https://www.phichaya.com',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'หมุดหมาย (Mudmy)',
                url: 'https://mudmy.app',
                logo: 'https://mudmy.app/logo1.png',
                description: 'แอปหมุดหมายที่เชื่อมโยงผู้คน สินค้า บริการ งาน ข่าวสาร และโอกาสใกล้บ้านในประเทศไทย',
                areaServed: { '@type': 'Country', name: 'Thailand' },
                knowsAbout: ['ตลาดชุมชน', 'สินค้าและบริการใกล้บ้าน', 'งานในชุมชน', 'ข่าวสารชุมชน'],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'หมุดหมาย Mudmy',
                url: 'https://mudmy.app',
                inLanguage: 'th-TH',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://mudmy.app/explore?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
            ]),
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
