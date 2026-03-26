import React from 'react';
import { Coins } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';

const SocialEarning = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <LoginPrompt type="socialEarning" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10 mt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl p-8 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_-12px_rgba(255,164,107,0.35)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center ring-4 ring-orange-100 flex-shrink-0">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-extrabold text-gray-900">Social Earning</h1>
              <p className="text-gray-600 mt-2">
                Social earning integration has been removed from this project.
              </p>
              <div className="mt-4 text-sm text-gray-700 bg-orange-50 border border-orange-200 rounded-xl p-3">
                This page is kept for backward navigation, but the feature is currently unavailable.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialEarning;

