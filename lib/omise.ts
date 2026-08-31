export type OmiseSourcePayload = {
  amount: number;
  currency: 'THB';
  type: 'promptpay';
  description: string;
  email?: string;
  phone?: string;
  name?: string;
  platformFee?: { type: 'fixed'; amount: number };
};

export function calculateOmiseAmount(amountThb: number): number {
  return Math.round(amountThb * 100);
}

export function buildOmisePromptpaySource(params: {
  amount: number;
  description: string;
  email?: string;
  phone?: string;
  name?: string;
}): OmiseSourcePayload {
  return {
    amount: calculateOmiseAmount(params.amount),
    currency: 'THB',
    type: 'promptpay',
    description: params.description,
    ...(params.email ? { email: params.email } : {}),
    ...(params.phone ? { phone: params.phone } : {}),
    ...(params.name ? { name: params.name } : {}),
  };
}
