export interface ParsedDischarge {
  patientName: string;
  epicId: string;
  phoneNumber: string | null;
  attendingPhysician: string;
  dischargeDate: string;
  primaryCareProvider: string | null;
  insurance: string;
  disposition: string;
  confidence: number;
  rawText: string;
}

export interface ParseResult {
  hospitalName: string;
  reportDate: string;
  records: ParsedDischarge[];
  rawText: string;
}

/**
 * Normalize a name that may have credentials in the wrong position.
 * e.g. "Sloan, MD Mark" → "Sloan, Mark MD"
 * e.g. "Kildare, James MD" → "Kildare, James MD" (already correct)
 */
function normalizeProviderName(raw: string): { name: string; confidence: number } {
  if (!raw || raw === '(missing)') {
    return { name: '', confidence: 0 };
  }

  const trimmed = raw.trim();

  // Pattern: "LastName, CREDENTIALS FirstName" (credentials in wrong place)
  const wrongOrder = trimmed.match(
    /^([^,]+),\s+(MD|DO|PA|NP|PA-C|RN|BSN)\s+(.+)$/i
  );
  if (wrongOrder) {
    return {
      name: `${wrongOrder[1]}, ${wrongOrder[3]} ${wrongOrder[2].toUpperCase()}`,
      confidence: 0.7,
    };
  }

  // Already correct: "LastName, FirstName MD"
  const correctOrder = trimmed.match(
    /^([^,]+),\s+(.+)\s+(MD|DO|PA|NP|PA-C|RN|BSN)$/i
  );
  if (correctOrder) {
    return { name: trimmed, confidence: 1.0 };
  }

  // No credentials found
  return { name: trimmed, confidence: 0.8 };
}

/**
 * Normalize phone number to E.164-ish format or return null if missing.
 */
function normalizePhone(raw: string): { phone: string | null; confidence: number } {
  if (!raw || raw.trim() === '' || raw.trim().toLowerCase() === '(missing)') {
    return { phone: null, confidence: 0 };
  }

  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10) {
    const formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return { phone: formatted, confidence: 1.0 };
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    const formatted = `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    return { phone: formatted, confidence: 1.0 };
  }

  // Return raw if we can't normalize
  return { phone: raw.trim(), confidence: 0.5 };
}

/**
 * Parse the pipe-delimited discharge table from Sacred Heart PDF text.
 */
export function parseDischargeText(text: string): ParseResult {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Extract hospital name and date from header
  let hospitalName = 'Unknown Hospital';
  let reportDate = '';

  const headerLine = lines.find((l) =>
    l.toLowerCase().includes('hospital') && l.toLowerCase().includes('discharges')
  );
  if (headerLine) {
    const headerMatch = headerLine.match(/^(.+?)\s+Discharges\s+for\s+(.+)$/i);
    if (headerMatch) {
      hospitalName = headerMatch[1].trim();
      reportDate = headerMatch[2].trim();
    }
  }

  // Find header row (contains "Name" and "Epic")
  const headerIdx = lines.findIndex(
    (l) => l.toLowerCase().includes('name') && l.toLowerCase().includes('epic')
  );

  if (headerIdx === -1) {
    return { hospitalName, reportDate, records: [], rawText: text };
  }

  // Parse data rows (everything after header that contains pipes)
  const dataLines = lines.slice(headerIdx + 1).filter((l) => l.includes('|'));

  const records: ParsedDischarge[] = dataLines.map((line) => {
    const fields = line.split('|').map((f) => f.trim());

    // Expected: Name | Epic Id | Phone | Attending | Date | PCP | Insurance | Disposition
    const [
      rawName = '',
      rawEpicId = '',
      rawPhone = '',
      rawAttending = '',
      rawDate = '',
      rawPcp = '',
      rawInsurance = '',
      rawDisposition = '',
    ] = fields;

    const phone = normalizePhone(rawPhone);
    const attending = normalizeProviderName(rawAttending);
    const pcp = normalizeProviderName(rawPcp);

    // Calculate overall confidence
    const confidenceFactors = [
      rawName ? 1.0 : 0,
      rawEpicId.match(/^EP\d+$/) ? 1.0 : 0.5,
      phone.confidence,
      attending.confidence,
      rawDate ? 1.0 : 0,
      pcp.confidence,
      rawInsurance && rawInsurance !== '(missing)' ? 1.0 : 0,
      rawDisposition && rawDisposition !== '(missing)' ? 1.0 : 0,
    ];
    const confidence =
      confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length;

    return {
      patientName: rawName || 'Unknown',
      epicId: rawEpicId || 'Unknown',
      phoneNumber: phone.phone,
      attendingPhysician: attending.name || rawAttending,
      dischargeDate: rawDate || '',
      primaryCareProvider: pcp.name || null,
      insurance: rawInsurance && rawInsurance !== '(missing)' ? rawInsurance : 'Unknown',
      disposition: rawDisposition && rawDisposition !== '(missing)' ? rawDisposition : 'Unknown',
      confidence: Math.round(confidence * 100) / 100,
      rawText: line,
    };
  });

  return { hospitalName, reportDate, records, rawText: text };
}

/**
 * Extract text from a PDF buffer and parse it.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<ParseResult> {
  // pdf-parse is CJS
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return parseDischargeText(data.text);
}
