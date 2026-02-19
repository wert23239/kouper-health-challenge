import express from 'express';
import cors from 'cors';
import path from 'path';
import uploadRoutes from './routes/uploads';
import dischargeRoutes from './routes/discharges';
import { PrismaClient } from '@prisma/client';
import { parseDischargeText } from './services/pdfParser';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/uploads', uploadRoutes);
app.use('/api/discharges', dischargeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-seed on first run
async function autoSeed() {
  const count = await prisma.upload.count();
  if (count === 0) {
    console.log('No data found. Auto-seeding...');
    const SAMPLE_TEXT = `Sacred Heart Hospital Discharges for July 4th, 2023
Name | Epic Id | Phone number | Attending Physician | Date | Primary Care Provider | Insurance | Disposition
Sunshine, Melody | EP001234567 | 202-555-0152 | Kildare, James MD | 07-04-2023 | Bailey, Miranda MD | BCBS | Home
O'Furniture, Patty | EP001239901 | 202-555-0148 | Hardy, Steve MD | 07-04-2023 | Webber, Richard MD | Aetna Health | HHS
Bacon, Chris P. | EP001237654 | 4047271234 | Manning, Steward Wallace PA | 07-04-2023 | Sloan, MD Mark | Self Pay | SNF
Mellow, S. Marsha Bayabygirl | EP001239876 | (missing) | House, Greg MD | 07-04-2023 | (missing) | Humana Health | Home`;

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
    console.log(`✅ Auto-seeded ${result.records.length} records`);
  }
}

app.listen(PORT, async () => {
  console.log(`🏥 Kouper Health Server running on http://localhost:${PORT}`);
  await autoSeed();
});

export default app;
