import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, Scissors, Minimize2, RotateCw, 
  Image as ImageIcon, FileCode, Binary, Type, FileText
} from 'lucide-react';
import { TOOLS, CATEGORIES, type ToolCategory, type ToolIconName } from '../config/tools';
import { adsAndAnalyticsConfig } from '../config/adsAndAnalytics';
import { AdSlot } from '../components/common/AdSlot';
import { UnifiedHero } from '../components/common/UnifiedHero';
import { getBadgeForTool, recordToolClick, type DynamicBadge } from '../lib/storage';

const ICON_MAP: Record<ToolIconName, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  scissors: Scissors,
  minimize: Minimize2,
  rotate: RotateCw,
  image: ImageIcon,
  'file-code': FileCode,
  binary: Binary,
  type: Type,
};

const CATEGORY_ICONS: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  media: ImageIcon,
  dev: FileCode,
  text: Type,
};

const BADGE_COLOR_MAP: Record<DynamicBadge['variant'], string> = {
  favorite: 'bg-amber-50 text-amber-700 border-amber-200',
  frequent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  popular: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const HomePage: React.FC = () => {
  const categoryKeys = Object.keys(CATEGORIES) as ToolCategory[];

  return (
    <div className="space-y-8 py-6 px-4 max-w-5xl mx-auto">
      {/* Combined Unified Dark Hero Banner */}
      <UnifiedHero />

      {/* Dynamic Categorized Grid */}
      <div className="space-y-8">
        {categoryKeys.map((catKey) => {
          const catInfo = CATEGORIES[catKey];
          const categoryTools = TOOLS.filter((t) => t.category === catKey);
          const CatIcon = CATEGORY_ICONS[catKey];

          if (categoryTools.length === 0) return null;

          return (
            <section key={catKey}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-indigo-50 text-indigo-600 rounded">
                    <CatIcon className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {catInfo.name}
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {catInfo.description}
                </span>
              </div>

              {/* Multi-Row Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categoryTools.map((tool) => {
                  const IconComponent = ICON_MAP[tool.icon] || FileText;
                  const badge = getBadgeForTool(tool.id, tool.isPopularInternet);
                  const badgeClass = badge ? BADGE_COLOR_MAP[badge.variant] : BADGE_COLOR_MAP.popular;

                  const CardBody = (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        {badge ? (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${badgeClass}`}>
                            {badge.text}
                          </span>
                        ) : !tool.isAvailable ? (
                          <span className="text-[9px] font-medium text-slate-400">Soon</span>
                        ) : null}
                      </div>

                      <h3 className="font-semibold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors leading-snug">
                        {tool.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  );

                  if (tool.isAvailable) {
                    return (
                      <Link
                        key={tool.id}
                        to={tool.path}
                        onClick={() => recordToolClick(tool.id)}
                        className="group py-2.5 px-3 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer block"
                      >
                        {CardBody}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={tool.id}
                      className="py-2.5 px-3 rounded-lg border border-slate-200/50 bg-slate-50 opacity-60 cursor-not-allowed select-none block"
                    >
                      {CardBody}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Bottom Ad Slot */}
      <div className="pt-2">
        <AdSlot slotId={adsAndAnalyticsConfig.ads.homeBottomBannerSlot} format="banner" />
      </div>
    </div>
  );
};