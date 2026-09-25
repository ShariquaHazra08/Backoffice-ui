import React, { useState } from 'react';
import { X, Check, Server, Key } from 'lucide-react';
import { getApiConfig, setApiConfig } from '../api/omsApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const current = getApiConfig();
  const [baseUrl, setBaseUrl] = useState(current.baseUrl);
  const [internalKey, setInternalKey] = useState(current.internalKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiConfig(baseUrl.trim(), internalKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSave();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-base text-white">OMS API Connection Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              OMS API Base URL
            </label>
            <div className="relative">
              <Server className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:8089/api/v1/oms"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Default when using dev proxy: <code className="text-indigo-400">/api/v1/oms</code> (or direct <code className="text-indigo-400">http://localhost:8089/api/v1/oms</code>).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Internal API Key (X-Internal-Key)
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={internalKey}
                onChange={(e) => setInternalKey(e.target.value)}
                placeholder="Optional internal secret key"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Matches <code className="text-indigo-400">OMS_INTERNAL_API_KEY</code> on the server.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-emerald-300" /> Saved!
                </>
              ) : (
                'Save Connection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
