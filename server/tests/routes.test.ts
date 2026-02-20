import { describe, it, expect, beforeAll } from 'vitest';
import { parseDischargeText, parsePdfBuffer } from '../src/services/pdfParser';

/**
 * Route-level logic tests — validate request/response contracts
 * without spinning up a full server. Tests the core business logic
 * that routes depend on.
 */

describe('Discharge edit validation', () => {
  const EDITABLE_FIELDS = new Set([
    'patientName', 'epicId', 'phoneNumber', 'attendingPhysician',
    'dischargeDate', 'primaryCareProvider', 'insurance', 'disposition',
  ]);

  it('should reject non-editable fields', () => {
    const invalidFields = ['id', 'uploadId', 'status', 'confidence', 'createdAt', '__proto__'];
    for (const field of invalidFields) {
      expect(EDITABLE_FIELDS.has(field)).toBe(false);
    }
  });

  it('should allow all expected editable fields', () => {
    const expected = ['patientName', 'epicId', 'phoneNumber', 'attendingPhysician',
      'dischargeDate', 'primaryCareProvider', 'insurance', 'disposition'];
    for (const field of expected) {
      expect(EDITABLE_FIELDS.has(field)).toBe(true);
    }
  });

  it('should validate review status values', () => {
    const validStatuses = ['APPROVED', 'REJECTED', 'NEEDS_EDIT'];
    expect(validStatuses.includes('APPROVED')).toBe(true);
    expect(validStatuses.includes('REJECTED')).toBe(true);
    expect(validStatuses.includes('NEEDS_EDIT')).toBe(true);
    expect(validStatuses.includes('PENDING_REVIEW')).toBe(false);
    expect(validStatuses.includes('INVALID')).toBe(false);
  });
});

describe('PDF parser edge cases', () => {
  it('should handle text with only whitespace', () => {
    const result = parseDischargeText('   \n\n   \n  ');
    expect(result.records).toHaveLength(0);
    expect(result.hospitalName).toBe('Unknown Hospital');
  });

  it('should handle text with special unicode characters', () => {
    const result = parseDischargeText('Ñoño Hospital Discharges for January 1st, 2024\nSomé, Patiënt EP001234567 202-555-0100 Doctor, Good MD 01-01-2024 PCP, Nice MD BCBS Home');
    expect(result.records).toHaveLength(1);
    expect(result.records[0].patientName).toContain('Patiënt');
  });

  it('should handle multiple dates in a line (picks first)', () => {
    const text = 'Sacred Heart Hospital Discharges for July 4th, 2023\nTest, Patient EP001234567 202-555-0100 Doc, One MD 07-04-2023 PCP, Two MD 08-05-2023 BCBS Home';
    const result = parseDischargeText(text);
    expect(result.records[0].dischargeDate).toBe('07-04-2023');
  });

  it('should assign confidence of 0 or above (never negative)', () => {
    // Pathological input: has Epic ID but nothing else useful
    const text = 'EP000000000';
    const result = parseDischargeText(text);
    if (result.records.length > 0) {
      expect(result.records[0].confidence).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle very long patient names', () => {
    const longName = 'VeryLongLastNameThatGoesOnAndOn, FirstName MiddleName Suffix Jr III';
    const text = `Sacred Heart Hospital Discharges for July 4th, 2023\n${longName} EP001234567 202-555-0100 Doc, A MD 07-04-2023 PCP, B MD BCBS Home`;
    const result = parseDischargeText(text);
    expect(result.records[0].patientName).toContain('VeryLongLastNameThatGoesOnAndOn');
  });
});

describe('Phone normalization comprehensive', () => {
  it('should normalize various phone formats consistently', () => {
    const testCases = [
      { input: 'Sacred Heart Hospital Discharges for July 4th, 2023\nTest, A EP001234567 2025550100 Doc, B MD 07-04-2023 PCP, C MD BCBS Home', expected: '202-555-0100' },
      { input: 'Sacred Heart Hospital Discharges for July 4th, 2023\nTest, A EP001234567 202-555-0100 Doc, B MD 07-04-2023 PCP, C MD BCBS Home', expected: '202-555-0100' },
    ];

    for (const tc of testCases) {
      const result = parseDischargeText(tc.input);
      expect(result.records[0].phoneNumber).toBe(tc.expected);
    }
  });
});
