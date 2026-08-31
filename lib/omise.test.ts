import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOmiseAmount, buildOmisePromptpaySource } from './omise';

describe('Omise helpers', () => {
  it('converts baht to satang for Omise', () => {
    assert.equal(calculateOmiseAmount(10), 1000);
  });

  it('builds a valid PromptPay source payload', () => {
    const payload = buildOmisePromptpaySource({
      amount: 10,
      description: 'Mudmy pin payment',
      email: 'demo@example.com',
    });

    assert.equal(payload.amount, 1000);
    assert.equal(payload.currency, 'THB');
    assert.equal(payload.type, 'promptpay');
    assert.equal(payload.description, 'Mudmy pin payment');
    assert.equal(payload.email, 'demo@example.com');
  });
});
