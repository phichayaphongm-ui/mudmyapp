# คู่มือ Deploy Mudmy Web ไป Hostinger

เว็บไซต์เป็นช่องทางหลักสำหรับการเปิดบริการในระยะแรก ส่วนแอป Flutter จะพัฒนาและ deploy แยกในระยะถัดไป

## 📦 ไฟล์ที่ต้องใช้
- **`mudmy-hostinger-deployment.zip`** - ไฟล์ deployment ที่สร้างขึ้นใหม่

## 🚀 ขั้นตอนการ Deploy

### 1. ล้างไฟล์เก่าทั้งหมดบน Hostinger
```bash
# ใน Hostinger Terminal
cd public_html
rm -rf .next .builds node_modules *
```

### 2. อัปโหลดไฟล์ zip ใหม่
- ไปที่ Hostinger Control Panel → File Manager
- อัปโหลด `mudmy-hostinger-deployment.zip` ไปที่ `public_html`
- แตกไฟล์ zip ใน `public_html`

### 3. ตั้งค่า Permission (สำคัญ!)
```bash
cd public_html
chmod +x scripts/hostinger-fix.sh
./scripts/hostinger-fix.sh
```

### 4. สร้างไฟล์ .env
- คัดลอก `.env.production.example` เป็น `.env`
- ใส่ Supabase URL และ anon key ของคุณใน `.env`

### 5. ติดตั้ง Dependencies
```bash
npm install
```

### 6. Build Application
```bash
npm run build
```

### 7. Start Server
```bash
npm start
```

## 🔧 ตั้งค่า Node.js บน Hostinger Panel
- ไปที่ Websites → Manage → Node.js
- **Application Root**: `/public_html`
- **Application Startup File**: ใช้ package.json หรือ `node_modules/next/dist/bin/next`
- **Node.js Version**: 20.x (แนะนำ)

## ⚠️ ถ้ายังเจอ Permission Error
ลองทำเพิ่มเติม:
```bash
cd public_html
chmod -R 777 app components lib public contexts hooks scripts
npm run build
```

## ✅ ตรวจสอบไฟล์ที่จำเป็น
- `package.json`
- `next.config.mjs`
- `app/` directory
- `components/` directory
- `lib/` directory
- `public/` directory
- `scripts/hostinger-fix.sh`
- `tsconfig.json`
- `postcss.config.mjs`
