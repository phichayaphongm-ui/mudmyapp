# Mudmy Marketplace Mobile App (Legacy)

โฟลเดอร์นี้เป็นต้นแบบ React Native รุ่นเก่า ปัจจุบันระบบหลักคือ Next.js Web App และ Flutter Mobile ซึ่งใช้ Supabase ร่วมกัน

## 🚀 Features

- **Cross-platform**: Works on both Android and iOS
- **Supabase**: Backend ของระบบหลักอยู่ในโปรเจกต์ Supabase เดียวกับ Web App
- **Modern UI**: Clean and intuitive interface
- **TypeScript**: Type-safe development

## 📱 Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd PukmudMarketplace
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## 🔧 Setup

### Configuration

หากจะนำต้นแบบนี้กลับมาพัฒนาต่อ ต้องเชื่อม Supabase และใช้ schema/API ชุดเดียวกับ Web App ก่อน

### Running the App

1. **Development Server**:
   ```bash
   npm start
   ```

2. **Android**:
   - Install Expo Go app on your Android device
   - Scan QR code from the terminal

3. **iOS**:
   - Install Expo Go app on your iPhone
   - Scan QR code from the terminal

## 📁 Project Structure

```
PukmudMarketplace/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx      # Marketplace screen
│   │   └── two.tsx        # Profile screen
│   └── _layout.tsx        # Root layout
├── config/                # Legacy app configuration
├── assets/                # Images and assets
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## 📱 Screens

### Marketplace
- Browse products
- View product details
- Search and filter

### Profile
- User authentication
- Account information
- Settings

## 🛠 Technologies

- **React Native** with **Expo**
- **TypeScript**
- **Supabase** (shared backend for the current product)
- **Expo Router** for navigation
- **React Native Paper** for UI components

## 📝 Development Notes

- The app uses anonymous authentication for demo purposes
- In production, implement email/password or social login
- Data integration should use the shared Supabase schema
- UI is responsive and works on different screen sizes

## 🚀 Deployment

### Android
1. Build with EAS Build:
   ```bash
   eas build --platform android
   ```

### iOS
1. Build with EAS Build:
   ```bash
   eas build --platform ios
   ```

## 📞 Support

For support or questions, contact Phichaya HR Solutions at www.phichaya.com

---

**Developer**: Phichaya HR Solutions  
**Website**: www.phichaya.com  
**App Name**: Pukmud Marketplace
