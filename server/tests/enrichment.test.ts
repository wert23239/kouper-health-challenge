import { describe, it, expect } from 'vitest';
import { validatePhone, verifyInsurance } from '../src/services/enrichment';

describe('validatePhone', () => {
  it('should validate 555 numbers as mobile', async () => {
    const result = await validatePhone('202-555-0100');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('mobile');
    expect(result.carrier).toBe('Verizon Wireless');
  });

  it('should identify 404 as landline', async () => {
    const result = await validatePhone('404-727-1234');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('landline');
  });

  it('should reject short numbers', async () => {
    const result = await validatePhone('12345');
    expect(result.valid).toBe(false);
    expect(result.type).toBe('invalid');
  });

  it('should handle empty string', async () => {
    const result = await validatePhone('');
    expect(result.valid).toBe(false);
    expect(result.type).toBe('invalid');
  });

  it('should default to mobile for standard numbers', async () => {
    const result = await validatePhone('301-555-9999');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('mobile');
  });

  it('should format with country code', async () => {
    const result = await validatePhone('202-555-0100');
    expect(result.formatted).toMatch(/^\+1/);
    expect(result.countryCode).toBe('US');
  });
});

describe('verifyInsurance', () => {
  it('should verify known insurance', async () => {
    const result = await verifyInsurance('BCBS', 'EP001234567');
    expect(result.verified).toBe(true);
    expect(result.planName).toContain('Blue Cross');
    expect(result.status).toBe('Active');
  });

  it('should handle unknown insurance', async () => {
    const result = await verifyInsurance('UnknownInsurance', 'EP001234567');
    expect(result.verified).toBe(false);
    expect(result.status).toBe('Unknown');
  });
});
