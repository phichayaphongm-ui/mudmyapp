# Mudmy Web - Vercel Deployment

เว็บไซต์ Mudmy ใช้ Next.js และ Supabase จึงสามารถ deploy บน Vercel ได้โดยไม่ต้องสร้าง `vercel.json` เพิ่ม

## 1. เตรียมโปรเจกต์

ตรวจสอบ Node.js 20 ขึ้นไป แล้วติดตั้ง dependencies:

```bash
pnpm install
pnpm build
```

ก่อนเปิด Production ควรแก้ TypeScript errors ให้หมด และไม่ควรใช้ `typescript.ignoreBuildErrors: true` ใน `next.config.mjs`

## 2. Deploy ผ่าน Vercel Dashboard

1. Push โปรเจกต์ขึ้น GitHub
2. เปิด [vercel.com](https://vercel.com) แล้วเลือก **Add New Project**
3. Import repository ของ Mudmy
4. ให้ Vercel ตรวจจับ Framework เป็น **Next.js**
5. ตั้งค่า Environment Variables ใน Production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_NAME=Mudmy
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

6. กด **Deploy**

## 3. Deploy ผ่านคำสั่ง

```bash
pnpm run deploy:vercel
```

ครั้งแรกระบบจะให้ login และเลือก Vercel project จากนั้นใช้คำสั่งเดิมเพื่อ deploy production ครั้งต่อไป

## 4. หลัง Deploy

- ตั้งค่า domain ใน Vercel Project Settings > Domains
- เปลี่ยน `NEXT_PUBLIC_APP_URL` ให้ตรงกับ domain จริง แล้ว redeploy
- เพิ่ม URL ของเว็บไซต์ใน Supabase Authentication > URL Configuration
- ตรวจสอบ Redirect URLs สำหรับ login และ callback
- เปิด Supabase backups และติดตาม Database/Storage usage
- ทดสอบ login, แผนที่, สร้างหมุด, รูปภาพ, chat และ API routes บน production

## หมายเหตุ

Vercel จะ deploy อัตโนมัติเมื่อ push ไปยัง branch ที่กำหนด โดย production ควรใช้ Supabase project แยกจาก development และไม่ commit ไฟล์ `.env` ที่มีค่าจริง
