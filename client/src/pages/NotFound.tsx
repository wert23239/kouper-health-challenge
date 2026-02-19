import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-6xl mb-4">🏥</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary">Back to Dashboard</Link>
    </div>
  );
}
