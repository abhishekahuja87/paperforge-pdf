import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Scissors, Minimize2, Lock, ShieldCheck, Zap, ServerOff } from 'lucide-react';

const TOOLS = [
  {
    title: 'Merge PDF',
    desc: 'Combine multiple PDF files into a single unified document in any order.',
    icon: Layers,
    href: '/merge-pdf',
    badge: 'Popular',
    available: true,
  },
  {
    title: 'Split PDF',
    desc: 'Extract specific pages or ranges into standalone documents.',
    icon: Scissors,
    href: '/split-pdf',
    available: false,
  },
  {
    title: 'Compress PDF',
    desc: 'Reduce file size efficiently while maintaining sharp text rendering.',
    icon: Minimize2,
    href: '/compress-pdf',
    available: false,
  },
  {
    title: 'Protect PDF',
    desc: 'Encrypt your document with AES-128 or AES-256 passwords.',
    icon: Lock,
    href: '/protect-pdf',
    available: false,
  },
];

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-16 py-12 px-4 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
          <ServerOff className="w-4 h-4 text-indigo-600" />
          <span>Zero-Server PDF Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Every PDF Tool You Need. <br />
          <span className="text-indigo-600">Zero Files Sent to Any Server.</span>
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          Manipulate, combine, and organize sensitive PDF files with complete peace of mind. All document rendering and assembly runs 100% inside your local browser memory.
        </p>
      </section>

      {/* Grid of Tools */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.title}
              className={`p-6 rounded-2xl border transition relative flex flex-col justify-between ${
                t.available
                  ? 'bg-white border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md'
                  : 'bg-slate-50 border-slate-200/70 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  {t.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                      {t.badge}
                    </span>
                  )}
                  {!t.available && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                      Soon
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{t.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
              </div>

              <div className="mt-6">
                {t.available ? (
                  <Link
                    to={t.href}
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Open Tool &rarr;
                  </Link>
                ) : (
                  <span className="text-xs font-medium text-slate-400">In Development</span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Privacy Guarantee Block */}
      <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
            Why Client-Side Matters for Your Documents
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Traditional online PDF converters upload your confidential bank statements, contracts, and medical records to remote cloud servers. PaperForge uses WebAssembly and client-side JavaScript to execute every byte of processing locally on your CPU.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          <div className="space-y-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-semibold text-sm">True Data Privacy</h4>
            <p className="text-xs text-slate-400">Files never touch the internet or a third-party server.</p>
          </div>
          <div className="space-y-1">
            <Zap className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="font-semibold text-sm">Instant Execution</h4>
            <p className="text-xs text-slate-400">Zero network upload and download wait times for massive files.</p>
          </div>
          <div className="space-y-1">
            <ServerOff className="w-6 h-6 text-indigo-400 mb-2" />
            <h4 className="font-semibold text-sm">Works Offline</h4>
            <p className="text-xs text-slate-400">Once cached, tools work seamlessly even without connectivity.</p>
          </div>
        </div>
      </section>
    </div>
  );
};