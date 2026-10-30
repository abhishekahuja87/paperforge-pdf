import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            Paper<span className="text-indigo-600">Forge</span>
          </span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium text-slate-600">
          <Link to="/merge-pdf" className="hover:text-indigo-600 transition">Merge</Link>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Server Privacy</span>
          </span>
        </nav>
      </div>
    </header>
  );
};