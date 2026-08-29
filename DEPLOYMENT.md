# Mudmy Web - Hostinger Deployment Guide

เอกสารนี้ครอบคลุมการเปิดบริการ **Web App เป็นช่องทางหลักในระยะแรก** เท่านั้น ส่วน Flutter Mobile อยู่ในแผนระยะถัดไปและไม่ต้องนำไปรวมใน deployment package ของเว็บไซต์

## 📋 Prerequisites

- Hostinger hosting plan (Node.js support)
- Supabase project credentials (same as your local development)
- Git (optional but recommended)

## 🚀 Quick Start

### Method 1: Using the Deployment Script

#### For Windows:
```powershell
# Run the PowerShell script
.\scripts\deploy-hostinger.ps1
```

#### For Linux/Mac:
```bash
# Make script executable
chmod +x scripts/deploy-hostinger.sh

# Run the script
./scripts/deploy-hostinger.sh
```

### Method 2: Manual Build

1. **Build the project:**
```bash
npm run build
```

2. **Create a zip file with these contents:**
   - `package.json`
   - `package-lock.json`
   - `public/` folder
   - `.next/` folder
   - `lib/` folder
   - `components/` folder
   - `app/` folder
   - `next.config.*` files (if any)

   **DO NOT include:**
   - `node_modules/`
   - `.env*.local`
   - `.git/`
   - `.DS_Store`

## 📝 Hostinger Setup Steps

### 1. Upload and Extract

1. Log into your Hostinger panel
2. Go to **Websites > Manage > File Manager**
3. Navigate to the `public_html` or your site root folder
4. Upload `mudmy-deployment.zip`
5. Right-click > **Extract**

### 2. Set Up Environment Variables

Create a `.env` file in the root folder with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_NAME=Mudmy
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Set Up Node.js Application

1. Go to **Websites > Manage**
2. Click on **Hosting > Node.js**
3. Set up the Node.js application:
   - **Application Root:** `/` (or your site root)
   - **Application Startup File:** `node_modules/next/dist/bin/next` or `package.json`
   - **Application Port:** Use the one provided by Hostinger
   - **Node.js Version:** 20.x or higher (recommended)

### 4. Install Dependencies

Open the Hostinger terminal and run:
```bash
npm install
```

### 5. Start the Application

```bash
# For development (temporary)
npm run dev

# For production (recommended)
npm run build  # if not built already
npm start
```

## 🔒 Important Security Notes

1. **Never commit `.env` files** to version control
2. Always use environment variables for sensitive data
3. Restrict file permissions on `.env` to `600` if possible

## 🌐 Domain and SSL

1. In Hostinger, go to **Websites > Manage > Domains**
2. Set up your domain
3. Enable SSL (Let's Encrypt is free and recommended)
4. Make sure to update `NEXT_PUBLIC_APP_URL` in `.env`

## 📱 Mobile App Roadmap

การเปิดตัวครั้งแรกเน้น Web App ให้บริการจริงก่อน โดยใช้ข้อมูลการใช้งานและ feedback เพื่อจัดลำดับฟีเจอร์ Mobile ในระยะถัดไป แอป Flutter จะใช้ backend และบัญชีผู้ใช้ร่วมกับเว็บไซต์ และ deploy แยกจาก Hostinger Web App

## 🐛 Troubleshooting

### Build Errors
- Check Node.js version compatibility (use 18.x or 20.x)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

### Environment Variables Not Loading
- Make sure the filename is exactly `.env`
- Restart the Node.js server after changes

### Port Issues
- Use the port provided by Hostinger
- Some hosting plans restrict port usage

## 📞 Need Help?

- Hostinger Support: https://www.hostinger.com/support
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
