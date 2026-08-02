import React from "react";
import { Building2, TrendingUp, TrendingDown, Award } from "lucide-react";

interface BentoMetricsProps {
  stats: {
    count: number;
    averageVariation: number;
    dividendEligibleCount: number;
  };
}

export const BentoMetrics: React.FC<BentoMetricsProps> = ({ stats }) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Card 1: Stocks count */}
      <div className="bg-white border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_#141414] flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider font-mono">
            Actions Suivies
          </span>
          <h3 className="text-3xl font-black font-mono text-[#141414] mt-1">
            {stats.count} / 30
          </h3>
          <p className="text-xs text-[#141414]/50 mt-1 font-mono">
            Composition officielle BRVM 30
          </p>
        </div>
        <div className="p-3 bg-slate-50 border-2 border-[#141414] rounded-none text-[#141414] shadow-[2px_2px_0px_#141414]">
          <Building2 className="w-6 h-6" />
        </div>
      </div>

      {/* Card 2: Average variation (High contrast dark bento block) */}
      <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.15)] flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#E4E3E0]/60 font-bold uppercase tracking-wider font-mono">
            Variation Moyenne
          </span>
          <div className="flex items-center mt-1 space-x-2">
            <span
              className={`text-3xl font-black font-mono ${
                stats.averageVariation >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {stats.averageVariation >= 0 ? "+" : ""}
              {stats.averageVariation.toFixed(2)}%
            </span>
            {stats.averageVariation >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <p className="text-xs text-[#E4E3E0]/50 mt-1 font-mono">
            Séance consolidée de l'indice
          </p>
        </div>
        <div className="p-3 bg-[#E4E3E0]/15 border border-[#E4E3E0]/30 rounded-none text-[#E4E3E0]">
          {stats.averageVariation >= 0 ? (
            <TrendingUp className="w-6 h-6" />
          ) : (
            <TrendingDown className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* Card 3: Dividends streak counts */}
      <div className="bg-white border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_#141414] flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider font-mono">
            Aristocrates Dividendes
          </span>
          <h3 className="text-3xl font-black font-mono text-emerald-700 mt-1">
            {stats.dividendEligibleCount}
          </h3>
          <p className="text-xs text-[#141414]/50 mt-1 font-mono">
            Versements continus depuis ≥ 3 ans
          </p>
        </div>
        <div className="p-3 bg-emerald-50 border-2 border-[#141414] rounded-none text-emerald-700 shadow-[2px_2px_0px_#141414]">
          <Award className="w-6 h-6" />
        </div>
      </div>
    </section>
  );
};
