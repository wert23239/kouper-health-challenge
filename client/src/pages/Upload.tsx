import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadFile(file, 'Coordinator');
      toast.success(`Parsed ${result.discharges.length} discharge records`);
      navigate(`/uploads/${result.upload.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Upload Discharge PDF</h1>
        <p className="text-slate-500 mt-1">Upload a hospital discharge list for parsing and review</p>
      </div>

      <div className="card max-w-2xl">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-teal-500 bg-teal-50' : 'border-slate-300 hover:border-slate-400'
          }`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="text-4xl mb-4">📄</div>
          <p className="text-slate-700 font-medium">
            {file ? file.name : 'Drop a PDF here or click to browse'}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports Sacred Heart Hospital discharge format'}
          </p>
        </div>

        {file && (
          <div className="mt-6 flex items-center gap-3">
            <button onClick={handleSubmit} disabled={uploading} className="btn-primary">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processing...
                </span>
              ) : (
                'Upload & Parse'
              )}
            </button>
            <button onClick={() => setFile(null)} className="btn-secondary">
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
