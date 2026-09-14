'use client'

import { useState } from 'react'
import { Check, Copy, Mail, KeyRound, ShieldCheck } from 'lucide-react'

const confirmHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ยืนยันที่อยู่อีเมล - หมุดหมาย (Mudmy)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #334155;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f6f8;
      padding: 40px 0;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 580px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #FF7E36 0%, #FF5722 100%);
      padding: 36px 30px 28px 30px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      background: #ffffff;
      padding: 10px 24px;
      border-radius: 18px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
      margin-bottom: 8px;
    }
    .logo-img {
      max-height: 65px;
      height: 65px;
      width: auto;
      display: block;
      margin: 0 auto;
    }
    .tagline {
      font-size: 14px;
      font-weight: 500;
      color: #FFF5F0;
      margin-top: 10px;
      letter-spacing: 0.3px;
    }
    .content {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      margin-bottom: 24px;
    }
    .btn-container {
      text-align: center;
      margin: 36px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #FF7E36 0%, #FF5722 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      padding: 16px 38px;
      border-radius: 14px;
      box-shadow: 0 8px 20px rgba(255, 126, 54, 0.35);
    }
    .divider {
      height: 1px;
      background-color: #f1f5f9;
      margin: 32px 0;
    }
    .link-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      word-break: break-all;
      font-size: 12px;
      color: #64748b;
      font-family: monospace;
      line-height: 1.5;
    }
    .security-note {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-top: 24px;
      background-color: #fff7ed;
      border-left: 4px solid #ff7e36;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main">
            <!-- Header Banner with Logo2 -->
            <div class="header">
              <div class="logo-badge">
                <img src="{{ .SiteURL }}/logo2.png" alt="หมุดหมาย (Mudmy)" class="logo-img" />
              </div>
              <div class="tagline">Mudmy - หมุดหมายโอกาสของคุณ</div>
            </div>

            <!-- Content Area -->
            <div class="content">
              <h1 class="greeting">ยินดีต้อนรับสู่ หมุดหมาย! 🎉</h1>
              <p class="paragraph">
                ขอบคุณที่ลงทะเบียนสร้างบัญชีผู้ใช้กับ <strong>หมุดหมาย (Mudmy)</strong> แพลตฟอร์มหมุดหมายโอกาส สินค้า และบริการรอบตัวคุณ
              </p>
              <p class="paragraph">
                อีกเพียงขั้นตอนเดียว! กรุณากดยืนยันที่อยู่อีเมลของคุณด้านล่าง เพื่อเปิดใช้งานบัญชีและเริ่มปักหมุดค้นหาโอกาสใหม่ๆ ได้ทันที
              </p>

              <!-- CTA Button -->
              <div class="btn-container">
                <a href="{{ .ConfirmationURL }}" class="btn" target="_blank">
                  ✨ ยืนยันอีเมลเข้าใช้งาน
                </a>
              </div>

              <!-- Security Warning -->
              <div class="security-note">
                🔒 <strong>ข้อแนะนำด้านความปลอดภัย:</strong> ลิงก์ยืนยันนี้มีอายุการใช้งานจำกัด หากคุณไม่ได้ทำการสมัครสมาชิกโปรดมองข้ามและลบอีเมลนี้ออกได้ทันที
              </div>

              <div class="divider"></div>

              <!-- Fallback Link -->
              <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
                หากปุ่มกดด้านบนไม่ทำงาน สามารถคัดลอกลิงก์ด้านล่างไปวางในเบราว์เซอร์ของคุณ:
              </p>
              <div class="link-box">
                <a href="{{ .ConfirmationURL }}" style="color: #ff7e36; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 8px 0;">© 2026 <strong>หมุดหมาย (Mudmy)</strong>. All rights reserved.</p>
              <p style="margin: 0;">แพลตฟอร์มตลาดออนไลน์บนแผนที่สำหรับคนไทย</p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`

const resetHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รีเซ็ตรหัสผ่าน - หมุดหมาย (Mudmy)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #334155;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f6f8;
      padding: 40px 0;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 580px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #FF7E36 0%, #FF5722 100%);
      padding: 36px 30px 28px 30px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      background: #ffffff;
      padding: 10px 24px;
      border-radius: 18px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
      margin-bottom: 8px;
    }
    .logo-img {
      max-height: 65px;
      height: 65px;
      width: auto;
      display: block;
      margin: 0 auto;
    }
    .tagline {
      font-size: 14px;
      font-weight: 500;
      color: #FFF5F0;
      margin-top: 10px;
      letter-spacing: 0.3px;
    }
    .content {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      margin-bottom: 24px;
    }
    .btn-container {
      text-align: center;
      margin: 36px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #FF7E36 0%, #FF5722 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      padding: 16px 38px;
      border-radius: 14px;
      box-shadow: 0 8px 20px rgba(255, 126, 54, 0.35);
    }
    .divider {
      height: 1px;
      background-color: #f1f5f9;
      margin: 32px 0;
    }
    .link-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      word-break: break-all;
      font-size: 12px;
      color: #64748b;
      font-family: monospace;
      line-height: 1.5;
    }
    .security-note {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-top: 24px;
      background-color: #fff7ed;
      border-left: 4px solid #ff7e36;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main">
            <!-- Header Banner with Logo2 -->
            <div class="header">
              <div class="logo-badge">
                <img src="{{ .SiteURL }}/logo2.png" alt="หมุดหมาย (Mudmy)" class="logo-img" />
              </div>
              <div class="tagline">Mudmy - หมุดหมายโอกาสของคุณ</div>
            </div>

            <!-- Content Area -->
            <div class="content">
              <h1 class="greeting">คำขอรีเซ็ตรหัสผ่าน 🔑</h1>
              <p class="paragraph">
                เราได้รับคำขอเปลี่ยนรหัสผ่านสำหรับบัญชี <strong>หมุดหมาย (Mudmy)</strong> ของคุณ
              </p>
              <p class="paragraph">
                หากคุณเป็นผู้ส่งคำขอนี้ กรุณากดปุ่มด้านล่างเพื่อกำหนดรหัสผ่านใหม่:
              </p>

              <!-- CTA Button -->
              <div class="btn-container">
                <a href="{{ .ConfirmationURL }}" class="btn" target="_blank">
                  🔐 รีเซ็ตรหัสผ่านของฉัน
                </a>
              </div>

              <!-- Security Warning -->
              <div class="security-note">
                🔒 <strong>ข้อแนะนำด้านความปลอดภัย:</strong> หากคุณไม่ได้เป็นผู้ส่งคำขอรีเซ็ตรหัสผ่าน โปรดมองข้ามอีเมลนี้ รหัสผ่านเดิมของคุณจะยังคงปลอดภัยและไม่มีการเปลี่ยนแปลงใดๆ
              </div>

              <div class="divider"></div>

              <!-- Fallback Link -->
              <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
                หากปุ่มกดด้านบนไม่ทำงาน สามารถคัดลอกลิงก์ด้านล่างไปวางในเบราว์เซอร์ของคุณ:
              </p>
              <div class="link-box">
                <a href="{{ .ConfirmationURL }}" style="color: #ff7e36; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 8px 0;">© 2026 <strong>หมุดหมาย (Mudmy)</strong>. All rights reserved.</p>
              <p style="margin: 0;">แพลตฟอร์มตลาดออนไลน์บนแผนที่สำหรับคนไทย</p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`

export default function EmailPreviewPage() {
  const [activeTab, setActiveTab] = useState<'confirm' | 'reset'>('confirm')
  const [copied, setCopied] = useState(false)

  const rawHtml = activeTab === 'confirm' ? confirmHtml : resetHtml
  const previewHtml = rawHtml.replace(/\{\{\s*\.SiteURL\s*\}\}/g, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(rawHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-500/20">
            📍
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Mudmy Email Template DOM Preview</h1>
            <p className="text-xs text-slate-400">ระบบแสดงผลและคัดลอก HTML แม่แบบอีเมลหมุดหมาย (พร้อมโลโก้ logo2.png)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-1 rounded-xl flex border border-slate-700">
            <button
              onClick={() => setActiveTab('confirm')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'confirm'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              ยืนยันอีเมล (Confirm Signup)
            </button>
            <button
              onClick={() => setActiveTab('reset')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reset'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              รีเซ็ตรหัสผ่าน (Reset Password)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'คัดลอกเรียบร้อย!' : 'คัดลอก HTML ไปใส่ Supabase'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* DOM Live Preview Frame */}
        <div className="flex-1 p-8 bg-slate-900 flex flex-col items-center justify-start overflow-y-auto">
          <div className="w-full max-w-[620px] bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-2xl mb-4">
            <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 mb-2 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Live DOM Render with logo2.png
              </span>
              <span className="font-mono text-orange-400">Subject: {activeTab === 'confirm' ? '[หมุดหมาย] ยืนยันที่อยู่อีเมลของคุณเพื่อเริ่มใช้งาน 📍' : '[หมุดหมาย] ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ 🔑'}</span>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[720px] rounded-xl bg-white border-0 shadow-inner"
              title="Email DOM Preview"
            />
          </div>
        </div>

        {/* Source Code Box */}
        <div className="w-[480px] border-l border-slate-800 bg-slate-950 flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">HTML Source Code</span>
            <span className="text-xs text-slate-500 font-mono">UTF-8 / Standalone HTML</span>
          </div>
          <textarea
            readOnly
            value={rawHtml}
            className="flex-1 p-4 bg-slate-950 text-sky-300 font-mono text-xs leading-relaxed border-0 outline-none resize-none"
          />
        </div>
      </div>
    </div>
  )
}
