import type { User, Pin } from '@/lib/types';

export interface AIAuditResult {
  readinessScore: number;
  identitySyncLevel: 'Basic' | 'Silver' | 'Gold' | 'Platinum';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  lastAuditAt: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * ฟังก์ชันประเมินความพร้อมแบบ Script-based (Rule-based)
 * พัฒนาขึ้นเพื่อทดแทนการใช้ AI API เพื่อความรวดเร็วและประหยัดทรัพยากร
 * อัปเดตล่าสุด: ลบ dependency @google/generative-ai ออกแล้ว
 */
export async function auditUserReadiness(user: User, pins: Pin[]): Promise<AIAuditResult> {
  // จำลองการประมวลผลเล็กน้อยเพื่อให้ UI ดูมีความเคลื่อนไหว
  await new Promise(resolve => setTimeout(resolve, 1500));

  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // --- 1. ประเมินข้อมูลโปรไฟล์ (สูงสุด 30 คะแนน) ---
  if (user.avatar) {
    score += 10;
    strengths.push("มีรูปโปรไฟล์ที่ชัดเจนช่วยสร้างตัวตน");
  } else {
    weaknesses.push("ขาดรูปโปรไฟล์ที่ช่วยสร้างความน่าเชื่อถือ");
    recommendations.push("ควรอัปโหลดรูปโปรไฟล์หรือโลโก้ร้านค้า");
  }

  if (user.nickname && user.nickname.length > 2) {
    score += 10;
    strengths.push("ชื่อเรียก (Nickname) จดจำง่าย");
  } else {
    weaknesses.push("ชื่อโปรไฟล์ยังไม่สมบูรณ์");
    recommendations.push("ตั้งชื่อเรียกที่สื่อถึงบริการของคุณให้ชัดเจน");
  }

  if (user.userType === 'business' || user.businessCategory) {
    score += 10;
    strengths.push("ระบุประเภทธุรกิจชัดเจน รองรับระบบค้นหา");
  } else {
    recommendations.push("ระบุประเภทธุรกิจเพื่อเพิ่มโอกาสในการถูกค้นพบ");
  }

  // --- 2. ประเมินข้อมูลหมุด (สูงสุด 40 คะแนน) ---
  if (pins.length > 0) {
    score += 15;
    strengths.push(`มีหมุดให้บริการทั้งหมด ${pins.length} จุด`);
    
    const hasImages = pins.every(p => p.images && p.images.length > 0);
    const hasGoodDesc = pins.every(p => p.description && p.description.length > 50);

    if (hasImages) {
      score += 15;
      strengths.push("รูปภาพประกอบในหมุดครบถ้วน");
    } else {
      weaknesses.push("บางหมุดยังขาดรูปภาพประกอบ");
      recommendations.push("เพิ่มรูปภาพคุณภาพสูงอย่างน้อย 2-3 รูปต่อหมุด");
    }

    if (hasGoodDesc) {
      score += 10;
    } else {
      weaknesses.push("คำอธิบายในหมุดสั้นเกินไป");
      recommendations.push("เขียนรายละเอียดบริการให้ชัดเจนและยาวขึ้น");
    }
  } else {
    weaknesses.push("ยังไม่มีการหมุดหมายในระบบ");
    recommendations.push("เริ่มต้นหมุดหมายแรกของคุณเพื่อเริ่มการวิเคราะห์ที่แม่นยำขึ้น");
  }

  // --- 3. ประเมินความน่าเชื่อถือและการตอบรับ (สูงสุด 30 คะแนน) ---
  if (user.rating >= 4) {
    score += 20;
    strengths.push(`ได้รับคะแนนรีวิวสูง (${user.rating.toFixed(1)} ดาว)`);
  } else if (user.rating > 0) {
    score += 10;
    weaknesses.push("คะแนนรีวิวยังอยู่ในระดับปานกลาง");
  }

  if (user.reviewCount > 5) {
    score += 10;
    strengths.push("มีฐานลูกค้าที่รีวิวสม่ำเสมอ");
  } else {
    recommendations.push("เชิญชวนลูกค้าเดิมมารีวิวเพื่อเพิ่มคะแนนความเชื่อมั่น");
  }

  let level: AIAuditResult['identitySyncLevel'] = 'Basic';
  if (score > 90) level = 'Platinum';
  else if (score > 70) level = 'Gold';
  else if (score > 40) level = 'Silver';

  return {
    readinessScore: Math.min(score, 100),
    identitySyncLevel: level,
    summary: score > 70 ? "คุณมีความพร้อมสูงมากในการทำธุรกิจบนแพลตฟอร์ม" : "คุณมีพื้นฐานที่ดี แต่ยังสามารถปรับปรุงเพื่อดึงดูดลูกค้าได้มากขึ้น",
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.length > 0 ? weaknesses.slice(0, 3) : ["ยังไม่พบจุดบกพร่องที่ชัดเจน"],
    recommendations: recommendations.slice(0, 3),
    lastAuditAt: new Date().toISOString(),
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    }
  };
}
