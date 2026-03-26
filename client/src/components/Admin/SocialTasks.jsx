import React from 'react';
import { Coins } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const SocialTasks = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white/70 border border-white/60 rounded-2xl p-8 shadow-[0_10px_30px_-12px_rgba(251,146,60,0.35)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center ring-4 ring-orange-100 flex-shrink-0">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Tasks Management</h1>
              <p className="text-gray-600">
                Social earning tasks have been removed from this project.
              </p>
              <div className="mt-4 text-sm text-gray-700 bg-orange-50 border border-orange-200 rounded-xl p-3">
                {user?.role === 'admin'
                  ? 'Admins will no longer be able to create/manage these tasks.'
                  : 'Please log in as an admin to manage social tasks.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialTasks;

