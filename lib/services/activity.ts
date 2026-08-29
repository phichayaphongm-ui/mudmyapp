import { supabase } from '@/lib/supabase';

export interface PulseEvent {
  id: string;
  type: 'pin' | 'review' | 'resolved';
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  targetId?: string;
  targetPath?: string;
}

export async function getRecentActivities(): Promise<PulseEvent[]> {
  try {
    // 1. Fetch latest 5 pins
    const { data: pins } = await supabase
      .from('pins')
      .select('id, owner_name, owner_avatar, title, district, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const pinEvents: PulseEvent[] = (pins || []).map((row) => ({
      id: row.id,
      type: 'pin',
      userName: row.owner_name || 'Someone',
      userAvatar: row.owner_avatar,
      content: `เพิ่งหมุดหมาย ${row.title} ที่ ${row.district}`,
      createdAt: row.created_at,
      targetId: row.id,
      targetPath: `/pin/${row.id}`,
    }));

    // 2. Fetch latest 5 reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, user_name, user_avatar, rating, pin_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const reviewEvents: PulseEvent[] = (reviews || []).map((row) => ({
      id: row.id,
      type: 'review',
      userName: row.user_name || 'Someone',
      userAvatar: row.user_avatar,
      content: `ให้ ${row.rating} ดาวแก่บริการในพื้นที่`,
      createdAt: row.created_at,
      targetId: row.pin_id,
      targetPath: `/pin/${row.pin_id}`,
    }));

    // Combine and sort
    const allEvents = [...pinEvents, ...reviewEvents].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return allEvents.slice(0, 10);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return getMockActivities();
  }
}

function getMockActivities(): PulseEvent[] {
  return [
    {
      id: 'm1',
      type: 'pin',
      userName: 'คุณสมชาย',
      content: 'เพิ่งหมุดหมาย "ร้านกาแฟคั่วบด" ที่บางนา',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'm2',
      type: 'review',
      userName: 'คุณนก',
      content: 'ได้รับความช่วยเหลือจากอาสาในพื้นที่แล้ว',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'm3',
      type: 'resolved',
      userName: 'ระบบ',
      content: 'เคสฉุกเฉินที่คลองเตยได้รับการแก้ไขแล้ว 5 เคสวันนี้',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'm4',
      type: 'pin',
      userName: 'คุณเปิ้ล',
      content: 'เปิดรับซ่อมเครื่องใช้ไฟฟ้าที่บ้าน แถวห้วยขวาง',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ];
}
