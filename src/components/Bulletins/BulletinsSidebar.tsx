import React from "react";
import { RefreshCw, FileDown, TrendingUp } from "lucide-react";

export interface BulletinItem {
  dateStr: string;
  dateCode: string;
  url: string;
}

interface BulletinsSidebarProps {
  bulletins: BulletinItem[];
  selectedBulletin: BulletinItem | null;
  isLoadingBulletins: boolean;
  onSelectBulletin: (bulletin: BulletinItem) => void;
  onRefreshBulletins: () => void;
}

export const BulletinsSidebar: React.FC<BulletinsSidebarProps> = ({
  bulletins,
  selectedBulletin,
  isLoadingBulletins,
  onSelectBulletin,
  onRefreshBulletins
}) => {
  const [showWhy, setShowWhy] = React.useState(false);

  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-[4px_4px_0px_#141414]">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#141414] mb-3 font-mono flex items-center justify-between">
          <span>Bulletins Récents (BOC)</span>
          {isLoadingBulletins && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />}
        </h3>
        <p className="text-[#141414]/70 text-[11px] font-mono leading-relaxed mb-4">
          Sélectionnez un bulletin officiel publié par la BRVM pour lancer l'analyse de séance par l'IA.
        </p>

        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {isLoadingBulletins && bulletins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 font-mono border-2 border-dashed border-[#141414]/20 bg-slate-50">
              <RefreshCw className="w-6 h-6 animate-spin text-[#141414]/60" />
              <span className="text-xs text-[#141414]/60">Scraping du portail brvm.org...</span>
            </div>
          ) : bulletins.length === 0 ? (
            <div className="text-center py-12 text-[#141414]/60 font-mono text-xs border-2 border-dashed border-[#141414]/20 bg-slate-50">
              Aucun bulletin trouvé sur la BRVM.
            </div>
          ) : (
            bulletins.map((bulletin) => {
              const isSelected = selectedBulletin?.dateCode === bulletin.dateCode;
              return (
                <div
                  key={bulletin.dateCode}
                  className={`w-full flex items-start border-2 transition-all ${
                    isSelected
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[3px_3px_0px_rgba(0,0,0,0.15)]"
                      : "bg-white hover:bg-slate-50 text-[#141414] border-[#141414] shadow-[2px_2px_0px_#141414]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBulletin(bulletin)}
                    aria-pressed={isSelected}
                    aria-label={`Bulletin du ${bulletin.dateStr}`}
                    className="flex-1 text-left p-3.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 focus:outline-none"
                  >
                    <div className="flex items-center space-x-1.5 mb-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                          isSelected
                            ? "bg-[#E4E3E0]/20 border-[#E4E3E0]/30 text-white"
                            : "bg-slate-100 border-[#141414]/20 text-[#141414]"
                        } font-mono`}
                      >
                        PDF
                      </span>
                      <span
                        className={`text-[9px] font-mono ${
                          isSelected ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        BOC_{bulletin.dateCode}
                      </span>
                    </div>
                    <h4 className="text-xs font-black tracking-tight leading-tight uppercase font-sans">
                      {bulletin.dateStr}
                    </h4>
                  </button>
                  <a
                    href={bulletin.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Télécharger le PDF d'origine du bulletin du ${bulletin.dateStr}`}
                    className={`p-1.5 m-3.5 border hover:opacity-80 rounded-none transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus:outline-none ${
                      isSelected
                        ? "border-[#E4E3E0]/30 hover:bg-[#E4E3E0]/15 text-white"
                        : "border-[#141414]/20 hover:bg-slate-100 text-[#141414]"
                    }`}
                    title="Télécharger le PDF d'origine"
                  >
                    <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onRefreshBulletins}
          disabled={isLoadingBulletins}
          className="w-full mt-4 bg-white hover:bg-slate-50 text-[#141414] text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-center space-x-1.5 font-mono"
        >
          <RefreshCw className={`w-3 h-3 ${isLoadingBulletins ? "animate-spin" : ""}`} />
          <span>Recharger la liste</span>
        </button>
      </div>

      {/* Informational Bento Card about Bulletins */}
      <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-4 shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={() => setShowWhy((prev) => !prev)}
          aria-expanded={showWhy}
          aria-controls="bulletin-benefits"
          className="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]"
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">
              Pourquoi analyser le BOC ?
            </h4>
          </div>
          <span className="text-xs font-mono text-amber-400 font-bold">
            {showWhy ? "−" : "+"}
          </span>
        </button>
        {showWhy && (
          <ul id="bulletin-benefits" className="mt-3 space-y-2 text-[11px] font-mono leading-relaxed text-[#E4E3E0]/80 border-t border-[#E4E3E0]/20 pt-3">
            <li className="flex items-start space-x-2">
              <span className="text-amber-400 font-bold">»</span>
              <span><strong className="text-white">Indices sectoriels :</strong> Forces motrices par secteur.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-400 font-bold">»</span>
              <span><strong className="text-white">Marché Obligataire :</strong> Taux et rendements des emprunts souverains.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-400 font-bold">»</span>
              <span><strong className="text-white">Opérations de Blocs :</strong> Transferts de parts stratégiques par institutionnels.</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};
