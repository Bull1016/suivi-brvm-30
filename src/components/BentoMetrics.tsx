import React from "react";
import { TrendingUp, TrendingDown, FileText } from "lucide-react";

interface BentoMetricsProps {
  stats: {
    count: number;
    averageVariation: number;
    dividendEligibleCount: number;
  };
  brvm30Url?: string;
}

export const BentoMetrics: React.FC<BentoMetricsProps> = ({ stats, brvm30Url }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6">
      {/* Card 1: Stocks count */}
      <div className="bg-white border-2 border-[#141414] rounded-none p-4 sm:p-5 shadow-[3px_3px_0px_#141414]">
        <span className="text-xs text-[#141414]/80 font-bold uppercase tracking-wider font-mono block">
          Actions Suivies
        </span>
        <h3 className="text-2xl sm:text-3xl font-black font-mono text-[#141414] mt-0.5">
          {stats.count} / 30
        </h3>
        <div className="flex items-center space-x-1 mt-1 text-xs text-[#141414]/80 font-mono">
          <span>Composition officielle (Avis 191-2026)</span>
          {brvm30Url && (
            <a
              href={brvm30Url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Voir le PDF officiel BRVM 30"
              className="inline-flex items-center text-rose-700 hover:text-rose-900 ml-1 font-bold"
              title="Voir l'Avis BRVM n°191-2026"
            >
              <FileText className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Card 2: Average variation */}
      <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] rounded-none p-4 sm:p-5 shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
        <span className="text-xs text-[#E4E3E0]/80 font-bold uppercase tracking-wider font-mono block">
          Variation Moyenne
        </span>
        <div className="flex items-center mt-0.5 space-x-1.5">
          <span
            className={`text-2xl sm:text-3xl font-black font-mono ${
              stats.averageVariation >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {stats.averageVariation >= 0 ? "+" : ""}
            {stats.averageVariation.toFixed(2)}%
          </span>
          {stats.averageVariation >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-400" aria-hidden="true" />
          )}
        </div>
        <p className="text-xs text-[#E4E3E0]/80 mt-1 font-mono">
          Moyenne des 30 titres de l'indice
        </p>
      </div>

      {/* Card 3: Dividends streak counts */}
      <div className="bg-white border-2 border-[#141414] rounded-none p-4 sm:p-5 shadow-[3px_3px_0px_#141414]">
        <span className="text-xs text-[#141414]/80 font-bold uppercase tracking-wider font-mono block">
          Payeurs Réguliers
        </span>
        <h3 className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-0.5">
          {stats.dividendEligibleCount}
        </h3>
        <p className="text-xs text-[#141414]/80 mt-1 font-mono">
          Versements continus (≥ 3 ans)
        </p>
      </div>
    </section>
  );
};
