import React from 'react';
import { useAlerts } from '../context/AlertContext';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';

export default function AlertBanner({ onClose }) {
  const { alerts } = useAlerts();
  const activeCount = alerts.length;

  if (activeCount === 0) return null;

  return (
    <div className="bg-red-50 border-b border-red-100 group">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        <Link
          to="/alerts"
          className="flex-1 py-2.5 flex items-center justify-between hover:bg-red-100/60 transition rounded-lg px-2 -ml-2"
        >
          <div className="flex items-center gap-2.5 text-red-700">
            <div className="w-5 h-5 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-sm font-semibold">
              {activeCount} active alert{activeCount !== 1 ? 's' : ''} require{activeCount === 1 ? 's' : ''} attention
            </span>
          </div>
          <div className="flex items-center gap-1 text-red-500 text-sm font-semibold">
            <span>View Alerts</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
        <button
          onClick={onClose}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100/80 rounded-lg transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
