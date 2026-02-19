interface Props {
  status: string;
}

const config: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending Review' },
  APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Approved' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
  COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completed' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
};

export default function StatusBadge({ status }: Props) {
  const c = config[status] || { bg: 'bg-slate-100', text: 'text-slate-800', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
