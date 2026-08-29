import { supabase } from '@/lib/supabase';

export type AnalyticsEventType = 'view' | 'click';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: string;
}

export interface DailyAnalytics {
  date: string;       // YYYY-MM-DD
  views: number;
  clicks: number;
}

/**
 * Log an analytics event (view or click) for a pin.
 * Events are stored in the pin_events table.
 */
export async function logAnalyticsEvent(
  pinId: string,
  type: AnalyticsEventType
): Promise<void> {
  try {
    await supabase.from('pin_events').insert({
      pin_id: pinId,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging analytics event:', error);
    // Non-blocking
  }
}

/**
 * Get daily aggregated analytics for a single pin over the last N days.
 */
export async function getPinDailyAnalytics(
  pinId: string,
  days: number = 7
): Promise<DailyAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('pin_events')
      .select('type, timestamp')
      .eq('pin_id', pinId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Build daily map
    const dailyMap = new Map<string, { views: number; clicks: number }>();

    // Pre-fill all days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { views: 0, clicks: 0 });
    }

    (data || []).forEach((event) => {
      const dateKey = event.timestamp.split('T')[0];
      if (dailyMap.has(dateKey)) {
        const entry = dailyMap.get(dateKey)!;
        if (event.type === 'view') entry.views++;
        else if (event.type === 'click') entry.clicks++;
      }
    });

    return Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  } catch (error) {
    console.error('Error fetching pin analytics:', error);
    return [];
  }
}

/**
 * Get aggregated daily analytics across ALL pins for a user over the last N days.
 */
export async function getUserDailyAnalytics(
  pinIds: string[],
  days: number = 7
): Promise<DailyAnalytics[]> {
  if (pinIds.length === 0) return [];

  try {
    const allEventsPromises = pinIds.map((pinId) => getPinDailyAnalytics(pinId, days));
    const allPinAnalytics = await Promise.all(allEventsPromises);

    const mergedMap = new Map<string, { views: number; clicks: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      mergedMap.set(key, { views: 0, clicks: 0 });
    }

    for (const pinDaily of allPinAnalytics) {
      for (const day of pinDaily) {
        const existing = mergedMap.get(day.date);
        if (existing) {
          existing.views += day.views;
          existing.clicks += day.clicks;
        }
      }
    }

    return Array.from(mergedMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return [];
  }
}
