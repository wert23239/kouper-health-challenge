import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Upload } from '../types';
import StatusBadge from '../components/StatusBadge';
import ConfidenceBadge from '../components/ConfidenceBadge';

export default function UploadDetail() {
  const { id } = useParams<{ id: string }>();
  const [upload, setUpload] = useState<Upload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUpload(Number(id)).then(setUpload).finally(() => setLoading(false));
  }, [id]);

  if (loading || !upload) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-slate-400 hover:text-slate-600">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-800">{upload.filename}</h1>
        <StatusBadge status={upload.status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-slate-500">Records Parsed</p>
          <p className="text-2xl font-bold text-slate-800">{upload.recordCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Uploaded By</p>
          <p className="text-2xl font-bold text-slate-800">{upload.uploadedBy}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Upload Date</p>
          <p className="text-2xl font-bold text-slate-800">{new Date(upload.uploadedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Discharge Records</h2>
        </div>

        {!upload.discharges || upload.discharges.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No records found in this upload</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-500 bg-slate-50">
                <th className="px-6 py-3 font-medium">Patient</th>
                <th className="px-6 py-3 font-medium">Epic ID</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Disposition</th>
                <th className="px-6 py-3 font-medium">Confidence</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {upload.discharges.map((d, i) => (
                <tr key={d.id} className={`border-b border-slate-100 hover:bg-teal-50/30 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <Link to={`/discharges/${d.id}`} className="text-teal-600 hover:text-teal-700 font-medium">
                      {d.patientName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{d.epicId}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{d.phoneNumber || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{d.disposition}</td>
                  <td className="px-6 py-4"><ConfidenceBadge confidence={d.confidence} /></td>
                  <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
