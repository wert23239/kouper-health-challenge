import { PrismaClient } from '@prisma/client';
import { parseDischargeText } from './services/pdfParser';

const prisma = new PrismaClient();

const SAMPLE_TEXT = `Sacred Heart Hospital Discharges for July 4th, 2023
Name | Epic Id | Phone number | Attending Physician | Date | Primary Care Provider | Insurance | Disposition
Sunshine, Melody | EP001234567 | 202-555-0152 | Kildare, James MD | 07-04-2023 | Bailey, Miranda MD | BCBS | Home
O'Furniture, Patty | EP001239901 | 202-555-0148 | Hardy, Steve MD | 07-04-2023 | Webber, Richard MD | Aetna Health | HHS
Bacon, Chris P. | EP001237654 | 4047271234 | Manning, Steward Wallace PA | 07-04-2023 | Sloan, MD Mark | Self Pay | SNF
Mellow, S. Marsha Bayabygirl | EP001239876 | (missing) | House, Greg MD | 07-04-2023 | (missing) | Humana Health | Home`;

async function seed() {
  console.log('🌱 Seeding database...');

  // Check if data already exists
  const existing = await prisma.upload.count();
  if (existing > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  const result = parseDischargeText(SAMPLE_TEXT);

  const upload = await prisma.upload.create({
    data: {
      filename: 'Sacred.Heart.Hospital.Discharges.pdf',
      uploadedBy: 'system',
      status: 'COMPLETED',
      rawText: result.rawText,
      recordCount: result.records.length,
    },
  });

  for (const record of result.records) {
    await prisma.discharge.create({
      data: {
        uploadId: upload.id,
        patientName: record.patientName,
        epicId: record.epicId,
        phoneNumber: record.phoneNumber,
        attendingPhysician: record.attendingPhysician,
        dischargeDate: record.dischargeDate,
        primaryCareProvider: record.primaryCareProvider,
        insurance: record.insurance,
        disposition: record.disposition,
        confidence: record.confidence,
        rawText: record.rawText,
        status: 'PENDING_REVIEW',
      },
    });
  }

  console.log(`✅ Seeded ${result.records.length} discharge records from ${result.hospitalName}`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
