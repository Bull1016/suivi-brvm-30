import React from "react";

export type TabType = "STOCKS" | "BULLETINS";

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="flex border-b-2 border-[#141414] mb-8 font-mono font-bold text-xs uppercase tracking-wider">
      <button
        onClick={() => onTabChange("STOCKS")}
        className={`px-6 py-3.5 border-t-2 border-l-2 border-r-2 border-[#141414] transition-all duration-200 focus:outline-none ${
          activeTab === "STOCKS"
            ? "bg-white text-[#141414] border-b-2 border-b-white translate-y-[2px]"
            : "bg-[#E4E3E0]/40 text-[#141414]/60 hover:text-[#141414] hover:bg-[#E4E3E0]/70"
        }`}
      >
        📊 Suivi des Cotations
      </button>
      <button
        onClick={() => onTabChange("BULLETINS")}
        className={`px-6 py-3.5 border-t-2 border-l-2 border-r-2 border-[#141414] ml-2 transition-all duration-200 focus:outline-none flex items-center space-x-2 relative ${
          activeTab === "BULLETINS"
            ? "bg-white text-[#141414] border-b-2 border-b-white translate-y-[2px]"
            : "bg-[#E4E3E0]/40 text-[#141414]/60 hover:text-[#141414] hover:bg-[#E4E3E0]/70"
        }`}
      >
        <span>📰 Bulletins de la Cote (BOC)</span>
        <span className="bg-rose-500 text-white font-sans text-[9px] font-bold px-1.5 py-0.5 animate-pulse">
          NOUVEAU
        </span>
      </button>
    </div>
  );
};
