import React from "react";
import { Info } from "lucide-react";

interface DividendLegendProps {
  lastYear: number;
}

export const DividendLegend: React.FC<DividendLegendProps> = ({ lastYear }) => {
  return (
    <section className="bg-white border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_#141414]">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#141414] mb-4 flex items-center space-x-1.5 font-mono">
        <Info className="w-4 h-4 text-[#141414]" />
        <span>Règles de qualification des dividendes :</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#141414]/80 leading-relaxed font-mono">
        <div className="space-y-2">
          <p className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 bg-[#141414] rotate-45 mt-1.5 flex-shrink-0" />
            <span>
              <strong className="text-[#141414] font-black">
                Badge Vert "D" (Score ≥ 3/5) :
              </strong>{" "}
              Attribué uniquement aux entreprises ayant versé des dividendes de manière
              ininterrompue depuis au moins 3 ans en partant du dernier exercice clos (
              {lastYear}).
            </span>
          </p>
          <p className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 bg-[#141414] rotate-45 mt-1.5 flex-shrink-0" />
            <span>
              <strong className="text-[#141414] font-black">
                Exemple de score 3/5 :
              </strong>{" "}
              Si des dividendes sont payés de manière continue en{" "}
              <strong className="text-[#141414] font-black">
                {lastYear}, {lastYear - 1} et {lastYear - 2}
              </strong>
              , l'entreprise se qualifie avec la mention{" "}
              <strong className="text-[#141414] font-black">3/5</strong>.
            </span>
          </p>
        </div>
        <div className="space-y-2">
          <p className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 bg-amber-600 rotate-45 mt-1.5 flex-shrink-0" />
            <span>
              <strong className="text-[#141414] font-black">
                Mention "0/5" (Non Éligible) :
              </strong>{" "}
              Attribuée si le cycle de versement consécutif est inférieur à 3 ans, ou s'il
              est rompu pour l'année {lastYear}.
            </span>
          </p>
          <p className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 bg-amber-600 rotate-45 mt-1.5 flex-shrink-0" />
            <span>
              <strong className="text-[#141414] font-black">
                Exemple de score 0/5 :
              </strong>{" "}
              Si l'entreprise verse des dividendes en {lastYear - 1}, {lastYear - 2}, mais
              que le versement pour{" "}
              <strong className="text-[#141414] font-black">
                {lastYear} est manquant
              </strong>
              , le score retombe à{" "}
              <strong className="text-[#141414] font-black">0/5</strong>.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};
