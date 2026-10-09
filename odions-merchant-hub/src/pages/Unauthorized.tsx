import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goBack = () => {
    if (user?.roles.includes('super_admin')) return navigate('/super-admin');
    if (user?.roles.includes('tenant_admin')) return navigate('/dashboard');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-400 text-sm mb-8">
          You don't have permission to view this page.
          {user && (
            <span className="block mt-1 text-gray-500">
              Your role: <span className="text-gray-300">{user.roles.join(', ')}</span>
            </span>
          )}
        </p>
        <button
          onClick={goBack}
          className="flex items-center gap-2 mx-auto bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Go back to dashboard
        </button>
      </div>
    </div>
  );
}