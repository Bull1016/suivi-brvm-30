import React from "react";
import { Info } from "lucide-react";

interface DividendLegendProps {
  lastYear: number;
}

export const DividendLegend: React.FC<DividendLegendProps> = ({ lastYear }) => {
  return (
    <div className="bg-white border-2 border-[#141414] rounded-none px-4 py-3 shadow-[2px_2px_0px_#141414] text-xs font-mono text-[#141414]/80 flex items-center space-x-2.5">
      <Info className="w-4 h-4 text-emerald-700 flex-shrink-0" aria-hidden="true" />
      <span>
        <strong className="text-[#141414]">Mention "D" (Score ≥ 3/5) :</strong> Attribuée aux entreprises ayant versé des dividendes sans interruption depuis au moins 3 exercices consécutifs (jusqu'à {lastYear}).
      </span>
    </div>
  );
};
