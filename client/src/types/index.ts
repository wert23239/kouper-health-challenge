export interface Upload {
  id: number;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  rawText?: string;
  recordCount: number;
  _count?: { discharges: number };
  discharges?: Discharge[];
}

export interface Discharge {
  id: number;
  uploadId: number;
  patientName: string;
  epicId: string;
  phoneNumber: string | null;
  attendingPhysician: string;
  dischargeDate: string;
  primaryCareProvider: string | null;
  insurance: string;
  disposition: string;
  status: 'PENDING_REVIEW' | 'NEEDS_EDIT' | 'APPROVED' | 'REJECTED';
  confidence: number;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rawText: string | null;
  createdAt: string;
  updatedAt: string;
  edits?: DischargeEdit[];
  enrichments?: Enrichment[];
  upload?: { filename: string };
}

export interface DischargeEdit {
  id: number;
  dischargeId: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  editedBy: string;
  editedAt: string;
  reason: string | null;
}

export interface Enrichment {
  id: number;
  dischargeId: number;
  fieldName: string;
  source: string;
  result: string;
  enrichedAt: string;
}

export interface Stats {
  total: number;
  pending: number;
  needsEdit: number;
  approved: number;
  rejected: number;
  uploads: number;
}
