import { describe, it, expect } from 'vitest';
import { parseDischargeText } from '../src/services/pdfParser';

const SAMPLE_TEXT = `Sacred Heart Hospital Discharges for July 4th, 2023
Name | Epic Id | Phone number | Attending Physician | Date | Primary Care Provider | Insurance | Disposition
Sunshine, Melody | EP001234567 | 202-555-0152 | Kildare, James MD | 07-04-2023 | Bailey, Miranda MD | BCBS | Home
O'Furniture, Patty | EP001239901 | 202-555-0148 | Hardy, Steve MD | 07-04-2023 | Webber, Richard MD | Aetna Health | HHS
Bacon, Chris P. | EP001237654 | 4047271234 | Manning, Steward Wallace PA | 07-04-2023 | Sloan, MD Mark | Self Pay | SNF
Mellow, S. Marsha Bayabygirl | EP001239876 | (missing) | House, Greg MD | 07-04-2023 | (missing) | Humana Health | Home`;

describe('parseDischargeText', () => {
  const result = parseDischargeText(SAMPLE_TEXT);

  it('should extract hospital name', () => {
    expect(result.hospitalName).toBe('Sacred Heart Hospital');
  });

  it('should extract report date', () => {
    expect(result.reportDate).toBe('July 4th, 2023');
  });

  it('should parse all 4 records', () => {
    expect(result.records).toHaveLength(4);
  });

  it('should parse standard record correctly', () => {
    const melody = result.records[0];
    expect(melody.patientName).toBe('Sunshine, Melody');
    expect(melody.epicId).toBe('EP001234567');
    expect(melody.phoneNumber).toBe('202-555-0152');
    expect(melody.attendingPhysician).toBe('Kildare, James MD');
    expect(melody.insurance).toBe('BCBS');
    expect(melody.disposition).toBe('Home');
  });

  it('should handle apostrophe in name', () => {
    const patty = result.records[1];
    expect(patty.patientName).toBe("O'Furniture, Patty");
    expect(patty.epicId).toBe('EP001239901');
  });

  it('should normalize phone number without dashes', () => {
    const chris = result.records[2];
    expect(chris.phoneNumber).toBe('404-727-1234');
  });

  it('should fix credentials in wrong position', () => {
    const chris = result.records[2];
    // "Sloan, MD Mark" should become "Sloan, Mark MD"
    expect(chris.primaryCareProvider).toBe('Sloan, Mark MD');
  });

  it('should handle missing phone number', () => {
    const marsha = result.records[3];
    expect(marsha.phoneNumber).toBeNull();
  });

  it('should handle missing PCP', () => {
    const marsha = result.records[3];
    expect(marsha.primaryCareProvider).toBeNull();
  });

  it('should assign lower confidence to records with issues', () => {
    const melody = result.records[0];
    const marsha = result.records[3];
    // Melody has all fields → high confidence
    // Marsha has missing fields → lower confidence
    expect(melody.confidence).toBeGreaterThan(marsha.confidence);
  });

  it('should handle empty input', () => {
    const empty = parseDischargeText('');
    expect(empty.records).toHaveLength(0);
  });

  it('should handle input with no data rows', () => {
    const headerOnly = parseDischargeText(
      'Sacred Heart Hospital Discharges for July 4th, 2023\nName | Epic Id | Phone number'
    );
    expect(headerOnly.records).toHaveLength(0);
  });
});
