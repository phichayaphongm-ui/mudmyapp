import { supabase } from '@/lib/supabase';
import type { Payment, PaymentStatus } from '@/lib/types';


function mapRowToPayment(row: any): Payment {
  return {
    id: row.id,
    userId: row.user_id,
    pinId: row.pin_id,
    amount: row.amount,
    status: row.status,
    method: row.method,
    promptpayRef: row.promptpay_ref,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export async function createPayment(paymentData: Omit<Payment, 'id'>): Promise<string> {
  try {
    const newId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('payments')
      .insert({
        id: newId,
        user_id: paymentData.userId,
        pin_id: paymentData.pinId ?? null,
        amount: paymentData.amount,
        status: paymentData.status,
        method: paymentData.method,
        promptpay_ref: paymentData.promptpayRef ?? null,
        created_at: paymentData.createdAt ?? new Date().toISOString(),
        paid_at: paymentData.paidAt ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id ?? newId;
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw error;
  }
}

export async function getUserPayments(userId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRowToPayment);
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw error;
  }
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}
