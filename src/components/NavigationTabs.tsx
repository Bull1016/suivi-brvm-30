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
  const tabRefs = React.useRef<Record<TabType, HTMLButtonElement | null>>({
    STOCKS: null,
    BULLETINS: null,
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentTab: TabType) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const nextTab = currentTab === "STOCKS" ? "BULLETINS" : "STOCKS";
    onTabChange(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Sections de suivi BRVM"
      className="flex border-b-2 border-[#141414] mb-6 font-mono font-bold text-xs uppercase tracking-wider overflow-x-auto whitespace-nowrap"
    >
      <button
        ref={(element) => { tabRefs.current.STOCKS = element; }}
        id="stocks-tab"
        type="button"
        role="tab"
        aria-selected={activeTab === "STOCKS"}
        aria-controls="stocks-panel"
        tabIndex={activeTab === "STOCKS" ? 0 : -1}
        onClick={() => onTabChange("STOCKS")}
        onKeyDown={(event) => handleKeyDown(event, "STOCKS")}
        className={`px-5 py-3 border-t-2 border-l-2 border-r-2 border-[#141414] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 ${
          activeTab === "STOCKS"
            ? "bg-white text-[#141414] border-b-2 border-b-white translate-y-[2px]"
            : "bg-[#E4E3E0]/40 text-[#141414]/60 hover:text-[#141414] hover:bg-[#E4E3E0]/70"
        }`}
      >
        📊 Cotations
      </button>
      <button
        ref={(element) => { tabRefs.current.BULLETINS = element; }}
        id="bulletins-tab"
        type="button"
        role="tab"
        aria-selected={activeTab === "BULLETINS"}
        aria-controls="bulletins-panel"
        tabIndex={activeTab === "BULLETINS" ? 0 : -1}
        onClick={() => onTabChange("BULLETINS")}
        onKeyDown={(event) => handleKeyDown(event, "BULLETINS")}
        className={`px-5 py-3 border-t-2 border-l-2 border-r-2 border-[#141414] ml-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-rose-500 flex items-center space-x-2 relative ${
          activeTab === "BULLETINS"
            ? "bg-white text-[#141414] border-b-2 border-b-white translate-y-[2px]"
            : "bg-[#E4E3E0]/40 text-[#141414]/60 hover:text-[#141414] hover:bg-[#E4E3E0]/70"
        }`}
      >
        <span>📰 Bulletins Officiels (BOC)</span>
        <span className="bg-rose-500 text-white font-sans text-[9px] font-bold px-1.5 py-0.5" aria-hidden="true">
          IA
        </span>
      </button>
    </div>
  );
};
