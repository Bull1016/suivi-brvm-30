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
                  onClick={() => onSelectBulletin(bulletin)}
                  className={`p-3.5 border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[3px_3px_0px_rgba(0,0,0,0.15)]"
                      : "bg-white hover:bg-slate-50 text-[#141414] border-[#141414] shadow-[2px_2px_0px_#141414]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
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
                            isSelected ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          BOC_{bulletin.dateCode}
                        </span>
                      </div>
                      <h4 className="text-xs font-black tracking-tight leading-tight uppercase font-sans">
                        {bulletin.dateStr}
                      </h4>
                    </div>
                    <a
                      href={bulletin.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`p-1.5 border hover:opacity-80 rounded-none transition-all ${
                        isSelected
                          ? "border-[#E4E3E0]/30 hover:bg-[#E4E3E0]/15 text-white"
                          : "border-[#141414]/20 hover:bg-slate-100 text-[#141414]"
                      }`}
                      title="Télécharger le PDF d'origine"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </a>
                  </div>
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
      <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.15)]">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">
            Pourquoi analyser le BOC ?
          </h4>
        </div>
        <ul className="space-y-3 text-[11px] font-mono leading-relaxed text-[#E4E3E0]/80">
          <li className="flex items-start space-x-2">
            <span className="text-amber-400 mt-0.5 font-bold">»</span>
            <span>
              <strong className="text-white">Indices sectoriels :</strong> Suivez les forces motrices
              des secteurs (Finance, Services Publics, etc.) plutôt que de simples actions isolées.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-amber-400 mt-0.5 font-bold">»</span>
            <span>
              <strong className="text-white">Marché Obligataire :</strong> Obtenez les taux réels et
              rendements des emprunts d'État souverains.
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-amber-400 mt-0.5 font-bold">»</span>
            <span>
              <strong className="text-white">Opérations de Blocs :</strong> Repérez les transferts
              de parts stratégiques par les grands institutionnels.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
