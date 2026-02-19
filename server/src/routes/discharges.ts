import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { validatePhone } from '../services/enrichment';

const router = Router();

// Async handler wrapper to catch promise rejections
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// GET /api/discharges - List with filters
router.get('/', asyncHandler(async (req, res) => {
  const { status, uploadId, search, page, limit } = req.query;

  const where: any = {};
  if (status && status !== 'ALL') where.status = status as string;
  if (uploadId) where.uploadId = parseInt(uploadId as string);
  if (search) {
    where.OR = [
      { patientName: { contains: search as string } },
      { epicId: { contains: search as string } },
    ];
  }

  const take = Math.min(parseInt(limit as string) || 100, 500);
  const skip = ((parseInt(page as string) || 1) - 1) * take;

  const [discharges, total] = await Promise.all([
    prisma.discharge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { upload: { select: { filename: true } } },
      take,
      skip,
    }),
    prisma.discharge.count({ where }),
  ]);

  res.json({ data: discharges, total, page: Math.floor(skip / take) + 1, pageSize: take });
}));

// GET /api/discharges/stats — MUST come before /:id
router.get('/stats', asyncHandler(async (_req, res) => {
  const [total, pending, approved, rejected, uploads] = await Promise.all([
    prisma.discharge.count(),
    prisma.discharge.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.discharge.count({ where: { status: 'APPROVED' } }),
    prisma.discharge.count({ where: { status: 'REJECTED' } }),
    prisma.upload.count(),
  ]);

  res.json({ total, pending, approved, rejected, uploads });
}));

// GET /api/discharges/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid discharge ID' });
  const discharge = await prisma.discharge.findUnique({
    where: { id },
    include: {
      edits: { orderBy: { editedAt: 'desc' } },
      enrichments: { orderBy: { enrichedAt: 'desc' } },
      upload: { select: { filename: true } },
    },
  });

  if (!discharge) {
    return res.status(404).json({ error: 'Discharge not found' });
  }

  res.json(discharge);
}));

// PATCH /api/discharges/:id - Edit with lineage
router.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid discharge ID' });
  const { fields, editedBy, reason } = req.body;

  if (!fields || typeof fields !== 'object' || !editedBy) {
    return res.status(400).json({ error: 'fields (object) and editedBy (string) are required' });
  }

  // Whitelist editable fields to prevent arbitrary column writes
  const EDITABLE_FIELDS = new Set([
    'patientName', 'epicId', 'phoneNumber', 'attendingPhysician',
    'dischargeDate', 'primaryCareProvider', 'insurance', 'disposition',
  ]);
  const invalidFields = Object.keys(fields).filter((k) => !EDITABLE_FIELDS.has(k));
  if (invalidFields.length > 0) {
    return res.status(400).json({ error: `Non-editable fields: ${invalidFields.join(', ')}` });
  }

  const discharge = await prisma.discharge.findUnique({ where: { id } });
  if (!discharge) {
    return res.status(404).json({ error: 'Discharge not found' });
  }

  // Create edit records for each changed field
  const editPromises = Object.entries(fields).map(([fieldName, newValue]) => {
    const oldValue = (discharge as any)[fieldName];
    if (oldValue === newValue) return null;

    return prisma.dischargeEdit.create({
      data: {
        dischargeId: id,
        fieldName,
        oldValue: oldValue?.toString() ?? '',
        newValue: (newValue as string) ?? '',
        editedBy,
        reason: reason || '',
      },
    });
  });

  await Promise.all(editPromises.filter(Boolean));

  // Update the discharge record
  const updated = await prisma.discharge.update({
    where: { id },
    data: fields,
    include: { edits: { orderBy: { editedAt: 'desc' } }, enrichments: true },
  });

  res.json(updated);
}));

// POST /api/discharges/:id/review
router.post('/:id/review', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid discharge ID' });
  const { status, reviewedBy } = req.body;

  if (!['APPROVED', 'REJECTED', 'NEEDS_EDIT'].includes(status)) {
    return res.status(400).json({ error: 'Status must be APPROVED, REJECTED, or NEEDS_EDIT' });
  }

  if (!reviewedBy) {
    return res.status(400).json({ error: 'reviewedBy is required' });
  }

  const discharge = await prisma.discharge.update({
    where: { id },
    data: { status, reviewedBy, reviewedAt: new Date() },
    include: { edits: true, enrichments: true },
  });

  res.json(discharge);
}));

// POST /api/discharges/:id/enrich
router.post('/:id/enrich', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid discharge ID' });
  const discharge = await prisma.discharge.findUnique({ where: { id } });

  if (!discharge) {
    return res.status(404).json({ error: 'Discharge not found' });
  }

  const results = [];

  // Phone validation
  if (discharge.phoneNumber) {
    const phoneResult = await validatePhone(discharge.phoneNumber);
    const enrichment = await prisma.enrichment.create({
      data: {
        dischargeId: id,
        fieldName: 'phoneNumber',
        source: 'twilio_lookup',
        result: JSON.stringify(phoneResult),
      },
    });
    results.push(enrichment);
  }

  res.json(results);
}));

export default router;
