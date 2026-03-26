import React from 'react';
import { ExternalLink } from 'lucide-react';

const PublicTask = () => {
  // Public-task flow relied on the removed social integration. Keeping this route to avoid broken navigation.
  const params = new URLSearchParams(window.location.search);
  const session = params.get('session');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6 mt-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/70 border border-white/60 rounded-2xl p-6 shadow-[0_10px_30px_-12px_rgba(251,146,60,0.35)]">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Public Task</h1>
          <div className="text-center space-y-4">
            <p className="text-gray-700">
              This public task flow required a social verification integration, which has been removed from this project.
            </p>
            {session && (
              <div className="text-xs text-gray-500 break-all">
                Session: {session}
              </div>
            )}
            <div className="pt-2">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-white px-6 py-2 rounded-xl font-semibold transition-all bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTask;

