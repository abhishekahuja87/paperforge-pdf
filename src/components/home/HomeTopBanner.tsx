import React from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HomeTopBannerProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export const HomeTopBanner: React.FC<HomeTopBannerProps> = ({
  query,
  onQueryChange,
}) => (
  <section className="relative overflow-hidden px-4 py-8 sm:py-12" aria-label="Find a tool">
    <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />

    <div className="relative mx-auto max-w-3xl">
      <div className="min-w-0 text-center">
        <h1 className="text-3xl font-black leading-[1.08] tracking-[-0.04em] text-stone-900 sm:text-4xl">
          Simple tools that work
          <span className="block text-orange-600">right in your browser.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">
          A growing collection of everyday tools with <strong className="font-bold text-orange-700">100% local file processing</strong> on your own device.
        </p>

        <label className="relative mx-auto mt-5 block max-w-lg text-left text-stone-800">
          <span className="sr-only">Search tools</span>
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search tools by name or what they do"
            className="w-full rounded-xl border-2 border-orange-200 bg-white py-3 pl-11 pr-4 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
        </label>

        <p className="mt-4 text-xs text-stone-600">
          Need something that isn’t here?{' '}
          <Link
            to="/contact"
            className="group inline-flex items-center gap-1 font-bold text-orange-700 underline decoration-orange-300 underline-offset-4 transition hover:text-orange-900"
          >
            Request a tool and we’ll build it for free
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </div>
  </section>
);
