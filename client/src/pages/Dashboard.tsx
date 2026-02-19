import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Stats, Upload } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getUploads()])
      .then(([s, u]) => { setStats(s); setUploads(u); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Uploads', value: stats?.uploads ?? 0, color: 'bg-blue-500', icon: '📁' },
    { label: 'Pending Review', value: stats?.pending ?? 0, color: 'bg-amber-500', icon: '⏳' },
    { label: 'Approved', value: stats?.approved ?? 0, color: 'bg-emerald-500', icon: '✅' },
    { label: 'Rejected', value: stats?.rejected ?? 0, color: 'bg-red-500', icon: '❌' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of discharge ingestion activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Uploads */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Uploads</h2>
          <Link to="/upload" className="btn-primary text-sm">
            New Upload
          </Link>
        </div>

        {uploads.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">📄</p>
            <p className="font-medium">No uploads yet</p>
            <p className="text-sm mt-1">Upload a discharge PDF to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                <th className="pb-3 font-medium">Filename</th>
                <th className="pb-3 font-medium">Uploaded By</th>
                <th className="pb-3 font-medium">Records</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <Link to={`/uploads/${u.id}`} className="text-teal-600 hover:text-teal-700 font-medium">
                      {u.filename}
                    </Link>
                  </td>
                  <td className="py-3 text-sm text-slate-600">{u.uploadedBy}</td>
                  <td className="py-3 text-sm text-slate-600">{u.recordCount}</td>
                  <td className="py-3"><StatusBadge status={u.status} /></td>
                  <td className="py-3 text-sm text-slate-500">
                    {new Date(u.uploadedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
