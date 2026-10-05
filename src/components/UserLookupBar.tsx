import React, { useState } from 'react';
import { Search, RotateCw, ArrowLeft } from 'lucide-react';

interface UserLookupBarProps {
  initialUserId?: string;
  onSearch: (userId: string, appOrderId?: string) => void;
  loading: boolean;
  onBackToDirectory?: () => void;
}

export const UserLookupBar: React.FC<UserLookupBarProps> = ({
  initialUserId = '',
  onSearch,
  loading,
  onBackToDirectory,
}) => {
  const [appOrderId, setAppOrderId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = initialUserId.trim();
    if (clean) {
      onSearch(clean, appOrderId.trim() || undefined);
    }
  };

  return (
    <div className="bg-white border border-[#E6E8EC] rounded-lg p-4 space-y-3">
      {/* Top row: Back to Directory & Search Form */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {onBackToDirectory && (
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-[#EEF1F4] hover:bg-[#E6E8EC] text-indigo-700 hover:text-indigo-800 border border-[#D8DCE3] rounded-lg transition cursor-pointer shrink-0"
            title="Return to Users Directory"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Order History</span>
          </button>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={appOrderId}
              onChange={(e) => setAppOrderId(e.target.value)}
              placeholder="Optional Order Ref (Symphony App Order ID or OMSLEG-ID)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D8DCE3] rounded-lg text-[#1A1D23] placeholder-[#9AA3B2] focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !initialUserId.trim()}
            className="inline-flex items-center justify-center px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#EEF1F4] disabled:text-slate-600 text-white rounded-lg shadow-sm transition cursor-pointer shrink-0"
          >
            {loading ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Search className="w-3.5 h-3.5 mr-1.5" />
            )}
            Fetch Orders
          </button>
        </form>
      </div>
    </div>
  );
};
