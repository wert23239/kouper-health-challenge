/**
 * Mock phone validation service (simulates Twilio Lookup API).
 */

export interface PhoneValidationResult {
  phoneNumber: string;
  valid: boolean;
  type: 'mobile' | 'landline' | 'voip' | 'invalid' | 'unknown';
  carrier: string | null;
  countryCode: string;
  formatted: string;
}

/**
 * Simulate Twilio phone lookup. Returns realistic mock results
 * based on the phone number pattern.
 */
export async function validatePhone(phoneNumber: string): Promise<PhoneValidationResult> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  if (!phoneNumber) {
    return {
      phoneNumber: '',
      valid: false,
      type: 'invalid',
      carrier: null,
      countryCode: 'US',
      formatted: '',
    };
  }

  const digits = phoneNumber.replace(/\D/g, '');

  // 555 numbers are fictitious
  if (digits.includes('555')) {
    return {
      phoneNumber,
      valid: true,
      type: 'mobile',
      carrier: 'Verizon Wireless',
      countryCode: 'US',
      formatted: `+1${digits}`,
    };
  }

  // 404 area code → landline
  if (digits.startsWith('404')) {
    return {
      phoneNumber,
      valid: true,
      type: 'landline',
      carrier: 'AT&T Southeast',
      countryCode: 'US',
      formatted: `+1${digits}`,
    };
  }

  // Short numbers are invalid
  if (digits.length < 10) {
    return {
      phoneNumber,
      valid: false,
      type: 'invalid',
      carrier: null,
      countryCode: 'US',
      formatted: phoneNumber,
    };
  }

  // Default: valid mobile
  return {
    phoneNumber,
    valid: true,
    type: 'mobile',
    carrier: 'T-Mobile',
    countryCode: 'US',
    formatted: `+1${digits}`,
  };
}

/**
 * Mock insurance verification.
 */
export async function verifyInsurance(
  insurance: string,
  epicId: string
): Promise<{ verified: boolean; planName: string; status: string }> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const known: Record<string, { planName: string; status: string }> = {
    BCBS: { planName: 'Blue Cross Blue Shield PPO', status: 'Active' },
    'Aetna Health': { planName: 'Aetna Health HMO', status: 'Active' },
    'Self Pay': { planName: 'Self Pay', status: 'N/A' },
    'Humana Health': { planName: 'Humana Gold Plus HMO', status: 'Active' },
  };

  const info = known[insurance];
  return {
    verified: !!info,
    planName: info?.planName || insurance,
    status: info?.status || 'Unknown',
  };
}
