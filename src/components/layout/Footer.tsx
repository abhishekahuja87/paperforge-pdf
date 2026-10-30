import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cpu, Zap, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <span className="font-extrabold text-lg text-white tracking-tight">
            Paper<span className="text-indigo-400">Forge</span>
          </span>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            The next-generation client-side PDF utility platform. Every operation happens locally inside your browser sandbox using WebAssembly and Web APIs. Your documents never reach a remote server.
          </p>
          <div className="flex items-center space-x-4 pt-2 text-xs text-slate-400">
            <span className="inline-flex items-center space-x-1"><Lock className="w-3.5 h-3.5 text-emerald-400" /> 100% Client-Side</span>
            <span className="inline-flex items-center space-x-1"><Cpu className="w-3.5 h-3.5 text-indigo-400" /> WebAssembly Powered</span>
            <span className="inline-flex items-center space-x-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Instant Processing</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Popular Utilities</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/merge-pdf" className="hover:text-white transition">Merge PDF</Link></li>
            <li><span className="text-slate-600">Split PDF (Coming soon)</span></li>
            <li><span className="text-slate-600">Compress PDF (Coming soon)</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Privacy & Compliance</h4>
          <ul className="space-y-2 text-xs">
            <li className="text-slate-400">Zero Data Retention</li>
            <li className="text-slate-400">GDPR Compliant by Design</li>
            <li className="text-slate-400">HIPAA Compliant (Local-only)</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} PaperForge. All PDF operations execute within your browser sandbox.
      </div>
    </footer>
  );
};