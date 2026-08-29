# คู่มือแก้ไขปัญหา Build บน Hostinger

## 🚨 ปัญหาที่พบบ่อย

### 1. Error: EACCES: permission denied
**วิธีแก้ไข:**
```bash
# ติดตั้ง script สำหรับแก้ไข permission
chmod +x scripts/deploy-fix.sh
./scripts/deploy-fix.sh
```

### 2. Build ล้มเหลว เพราะ Standalone Mode
ถ้าปัญหายังคงอยู่ ให้ลองปิด `output: 'standalone'` ใน `next.config.mjs`:
```javascript
const nextConfig = {
  // output: 'standalone', // <-- comment out บรรทัดนี้
  // ...config อื่นๆ
}
```

### 3. Clean Build (แนะนำ)
```bash
# ล้างทุกอย่างแล้วสร้างใหม่
rm -rf node_modules .next package-lock.json
npm install
npm run build
```

## 📋 ขั้นตอนการ Deploy ที่ถูกต้อง

1. **อัปโหลดไฟล์:**
   - ใช้ `mudmy-deployment-source.zip` (ไม่รวม node_modules และ .next)
   
2. **สร้างไฟล์ .env:**
   - คัดลอก `.env.production.example` เป็น `.env`
   - ใส่ Supabase URL และ anon key ของคุณ

3. **รันคำสั่งบน Hostinger Terminal:**
   ```bash
   # 1. ติดตั้ง dependencies
   npm install

   # 2. Build app
   npm run build

   # 3. Start server
   npm start
   ```

4. **ตั้งค่า Node.js บน Hostinger Panel:**
   - Application Root: `/public_html`
   - Application Startup File: Use package.json or `node_modules/next/dist/bin/next`
   - Node.js Version: 20.x หรือ 18.x

## 🛠️ วิธีแก้ไขฉุกเฉิน

### ถ้า Build ยังไม่สำเร็จ:
```bash
# ลองใช้ Node.js เวอร์ชั่นที่เสถียร
node -v
# ถ้าเวอร์ชั่นเกินไป ให้ติดตั้งใหม่
```

### ติดตั้ง Node.js เวอร์ชั่น 20 บน Hostinger:
```bash
# ติดตั้ง nvm ถ้ายังไม่มี
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# ติดตั้ง Node.js 20
nvm install 20
nvm use 20

# ตรวจสอบเวอร์ชั่น
node -v
```
