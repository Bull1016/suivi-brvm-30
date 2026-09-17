import React, { useState, useEffect, useMemo } from "react";
import { StockData, BRVMResponse } from "./types";
import {
  DEFAULT_SYMBOL_SECTOR_FALLBACK
} from "./constants/brvmData";

// Components
import { StatusBanner } from "./components/StatusBanner";
import { Header } from "./components/Header";
import { NavigationTabs, TabType } from "./components/NavigationTabs";
import { BentoMetrics } from "./components/BentoMetrics";
import { StockFilters } from "./components/StockFilters";
import { StocksTable } from "./components/StocksTable";
import { DividendLegend } from "./components/DividendLegend";
import { StockDetailDrawer } from "./components/StockDetailDrawer";
import { BulletinsSidebar, BulletinItem } from "./components/Bulletins/BulletinsSidebar";
import { BulletinAnalysisView } from "./components/Bulletins/BulletinAnalysisView";

export default function App() {
  const lastYear = new Date().getFullYear() - 1;

  // ─── Data states ───────────────────────────────────────────────
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [lastSync, setLastSync] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [brvm30Url, setBrvm30Url] = useState<string>("https://www.sikafinance.com/docs/brvm-30-composition-de-l-indice-brvm-30.pdf");
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // ─── Filter states ─────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [dividendFilter, setDividendFilter] = useState<"ALL" | "ELIGIBLE" | "INELIGIBLE">("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [pricePreset, setPricePreset] = useState<string>("ALL");

  // ─── Sort states ────────────────────────────────────────────────
  const [sortField, setSortField] = useState<keyof StockData | "">("variation");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // ─── Detail drawer states ───────────────────────────────────────
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [isUpdatingDividends, setIsUpdatingDividends] = useState<boolean>(false);
  const [dividendUpdateMsg, setDividendUpdateMsg] = useState<string | null>(null);
  const [companyDescription, setCompanyDescription] = useState<string | null>(null);
  const [isFetchingDescription, setIsFetchingDescription] = useState<boolean>(false);

  // ─── Tab / Bulletins states ─────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>("STOCKS");
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [isLoadingBulletins, setIsLoadingBulletins] = useState<boolean>(false);
  const [selectedBulletin, setSelectedBulletin] = useState<BulletinItem | null>(null);
  const [bulletinAnalysis, setBulletinAnalysis] = useState<string | null>(null);
  const [bulletinSources, setBulletinSources] = useState<{ title: string; uri: string }[]>([]);
  const [isAnalyzingBulletin, setIsAnalyzingBulletin] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [bulletinLoadingStep, setBulletinLoadingStep] = useState<number>(0);

  // ─── Effects ────────────────────────────────────────────────────

  // Fetch stocks on mount
  useEffect(() => {
    fetchStocks();
  }, []);

  // Fetch company description when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      fetchCompanyDescription(selectedStock.symbol, selectedStock.country);
    } else {
      setCompanyDescription(null);
    }
  }, [selectedStock?.symbol]);

  // Reset bulletin analysis when selected bulletin changes
  useEffect(() => {
    if (selectedBulletin) {
      setBulletinAnalysis(null);
      setBulletinSources([]);
      setAnalysisError(null);
    }
  }, [selectedBulletin?.dateCode]);

  // Load bulletins when bulletin tab is first opened
  useEffect(() => {
    if (activeTab === "BULLETINS" && bulletins.length === 0) {
      fetchBulletins();
    }
  }, [activeTab]);

  // ─── API calls ──────────────────────────────────────────────────

  const fetchStocks = async () => {
    try {
      setError(null);
      const res = await fetch("/api/brvm30/stocks");
      if (!res.ok) throw new Error("Erreur de récupération des données");
      const data: BRVMResponse & { brvm30Url?: string } = await res.json();
      if (data.success) {
        setStocks(data.stocks);
        setLastSync(data.lastSync);
        setIsSyncing(data.isSyncing);
        if (data.brvm30Url) setBrvm30Url(data.brvm30Url);

        if (selectedStock) {
          const updated = data.stocks.find((s) => s.symbol === selectedStock.symbol);
          if (updated) setSelectedStock(updated);
        }
      } else {
        setError(data.message || "Une erreur est survenue");
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de contacter le serveur. Assurez-vous que l'application a démarré.");
    }
  };

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    showStatus("Synchronisation des cotations avec Sika Finance…", "info");

    try {
      const res = await fetch("/api/brvm30/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.stocks)) {
          setStocks(data.stocks);
          if (selectedStock) {
            const updated = data.stocks.find((s: StockData) => s.symbol === selectedStock.symbol);
            if (updated) setSelectedStock(updated);
          }
        }
        if (data.lastSync) setLastSync(data.lastSync);
        setIsSyncing(false);
        showStatus("Mise à jour des cotations terminée avec succès !", "success");
      } else {
        setIsSyncing(false);
        showStatus(data.message || "Échec de la synchronisation", "error");
      }
    } catch (err) {
      setIsSyncing(false);
      showStatus("Erreur lors de la tentative de synchronisation", "error");
    }
  };

  const syncStockDividends = async (symbol: string) => {
    if (isUpdatingDividends) return;
    setIsUpdatingDividends(true);
    setDividendUpdateMsg("Récupération en direct de l'historique des dividendes…");

    try {
      const res = await fetch(`/api/brvm30/sync-dividends/${symbol}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDividendUpdateMsg("Historique des dividendes mis à jour avec succès !");
        await fetchStocks();
        if (data.stock) {
          setSelectedStock(data.stock);
        }
      } else {
        setDividendUpdateMsg(`Échec : ${data.message}`);
      }
    } catch (err) {
      setDividendUpdateMsg("Erreur réseau lors de la mise à jour.");
    } finally {
      setIsUpdatingDividends(false);
      setTimeout(() => setDividendUpdateMsg(null), 4000);
    }
  };

  const fetchCompanyDescription = async (symbol: string, country: string) => {
    setIsFetchingDescription(true);
    setCompanyDescription(null);
    try {
      const res = await fetch(`/api/brvm30/company-description/${symbol}/${country}`);
      const data = await res.json();
      if (data.success) {
        setCompanyDescription(data.description);
      } else {
        setCompanyDescription("Impossible de charger la description de l'entreprise.");
      }
    } catch (e) {
      console.error(e);
      setCompanyDescription("Erreur réseau lors de la récupération de la description.");
    } finally {
      setIsFetchingDescription(false);
    }
  };

  const fetchBulletins = async () => {
    setIsLoadingBulletins(true);
    try {
      const res = await fetch("/api/brvm/bulletins");
      const data = await res.json();
      if (data.success) {
        setBulletins(data.bulletins);
        if (data.bulletins.length > 0 && !selectedBulletin) {
          setSelectedBulletin(data.bulletins[0]);
        }
      } else {
        showStatus("Impossible de charger les bulletins de la cote.", "error");
      }
    } catch (e) {
      console.error(e);
      showStatus("Erreur lors de la récupération des bulletins.", "error");
    } finally {
      setIsLoadingBulletins(false);
    }
  };

  const runBulletinAnalysis = async (bulletin: BulletinItem) => {
    if (isAnalyzingBulletin) return;
    setIsAnalyzingBulletin(true);
    setBulletinAnalysis(null);
    setBulletinSources([]);
    setAnalysisError(null);
    setBulletinLoadingStep(0);

    const stepInterval = setInterval(() => {
      setBulletinLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 3500);

    try {
      const res = await fetch(
        `/api/brvm/analyze-bulletin/${bulletin.dateCode}?url=${encodeURIComponent(bulletin.url)}`
      );
      const data = await res.json();
      clearInterval(stepInterval);

      if (data.success) {
        setBulletinAnalysis(data.analysis);
        setBulletinSources(data.sources || []);
      } else {
        setAnalysisError(data.message || "Erreur lors de la génération de l'analyse.");
      }
    } catch (e) {
      clearInterval(stepInterval);
      console.error(e);
      setAnalysisError("Erreur de communication avec le serveur d'analyse.");
    } finally {
      setIsAnalyzingBulletin(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────

  const showStatus = (text: string, type: "success" | "error" | "info") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const applyPricePreset = (preset: string) => {
    setPricePreset(preset);
    if (preset === "ALL") {
      setMinPrice("");
      setMaxPrice("");
    } else if (preset === "UNDER_2500") {
      setMinPrice("");
      setMaxPrice("2500");
    } else if (preset === "2500_10000") {
      setMinPrice("2500");
      setMaxPrice("10000");
    } else if (preset === "OVER_10000") {
      setMinPrice("10000");
      setMaxPrice("");
    }
  };

  const handleSort = (field: keyof StockData) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // ─── Derived data ────────────────────────────────────────────────

  // Normalize sector using fallback map
  const processedStocks = useMemo(() => {
    return stocks.map((s) => ({
      ...s,
      sector: s.sector || DEFAULT_SYMBOL_SECTOR_FALLBACK[s.symbol] || "Services Financiers"
    }));
  }, [stocks]);

  // Summary stats for bento cards
  const stats = useMemo(() => {
    if (processedStocks.length === 0) {
      return { count: 0, averageVariation: 0, dividendEligibleCount: 0 };
    }
    const count = processedStocks.length;
    const totalVariation = processedStocks.reduce((sum, s) => sum + s.variation, 0);
    const averageVariation = totalVariation / count;
    const dividendEligibleCount = processedStocks.filter((s) => s.streak >= 3).length;
    return { count, averageVariation, dividendEligibleCount };
  }, [processedStocks]);

  // Stocks filtered by everything except sector/country (used for badge counts)
  const stocksFilteredByOthers = useMemo(() => {
    let result = [...processedStocks];

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.symbol.toLowerCase().includes(lowerSearch) ||
          s.name.toLowerCase().includes(lowerSearch) ||
          (s.sector && s.sector.toLowerCase().includes(lowerSearch))
      );
    }

    if (dividendFilter === "ELIGIBLE") {
      result = result.filter((s) => s.streak >= 3);
    } else if (dividendFilter === "INELIGIBLE") {
      result = result.filter((s) => s.streak < 3);
    }

    if (minPrice !== "" && !isNaN(Number(minPrice))) {
      result = result.filter((s) => s.currentPrice >= Number(minPrice));
    }
    if (maxPrice !== "" && !isNaN(Number(maxPrice))) {
      result = result.filter((s) => s.currentPrice <= Number(maxPrice));
    }

    return result;
  }, [processedStocks, searchTerm, dividendFilter, minPrice, maxPrice]);

  // Fully filtered and sorted list for the table
  const filteredAndSortedStocks = useMemo(() => {
    let result = [...stocksFilteredByOthers];

    if (selectedCountry !== "ALL") {
      result = result.filter((s) => s.country === selectedCountry.toLowerCase());
    }

    if (selectedSector !== "ALL") {
      result = result.filter((s) => s.sector === selectedSector);
    }

    if (sortField !== "") {
      result.sort((a, b) => {
        const valA = a[sortField as keyof StockData];
        const valB = b[sortField as keyof StockData];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        return 0;
      });
    }

    return result;
  }, [stocksFilteredByOthers, selectedCountry, selectedSector, sortField, sortDirection]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans antialiased pb-12 touch-action-manipulation">
      {/* Toast notification */}
      <StatusBanner statusMsg={statusMsg} />

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page header */}
        <Header
          brvm30Url={brvm30Url}
          isSyncing={isSyncing}
          lastSync={lastSync}
          onTriggerSync={triggerSync}
        />

        {/* Tab navigation */}
        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ── STOCKS TAB ─────────────────────────────────────────── */}
        {activeTab === "STOCKS" ? (
          <>
            {/* KPI bento cards */}
            <BentoMetrics stats={stats} />

            {/* Search + filters toolbar */}
            <StockFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              dividendFilter={dividendFilter}
              setDividendFilter={setDividendFilter}
              selectedSector={selectedSector}
              setSelectedSector={setSelectedSector}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              pricePreset={pricePreset}
              setPricePreset={setPricePreset}
              selectedCountry={selectedCountry}
              setSelectedCountry={setSelectedCountry}
              stocksFilteredByOthers={stocksFilteredByOthers}
              applyPricePreset={applyPricePreset}
            />

            {/* Data table */}
            <StocksTable
              stocks={filteredAndSortedStocks}
              selectedStock={selectedStock}
              onSelectStock={setSelectedStock}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              error={error}
            />

            {/* Dividend eligibility legend */}
            <DividendLegend lastYear={lastYear} />
          </>
        ) : (
          /* ── BULLETINS TAB ───────────────────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            <BulletinsSidebar
              bulletins={bulletins}
              selectedBulletin={selectedBulletin}
              isLoadingBulletins={isLoadingBulletins}
              onSelectBulletin={setSelectedBulletin}
              onRefreshBulletins={fetchBulletins}
            />
            <BulletinAnalysisView
              selectedBulletin={selectedBulletin}
              bulletinAnalysis={bulletinAnalysis}
              bulletinSources={bulletinSources}
              isAnalyzingBulletin={isAnalyzingBulletin}
              analysisError={analysisError}
              bulletinLoadingStep={bulletinLoadingStep}
              onRunAnalysis={runBulletinAnalysis}
            />
          </div>
        )}
      </main>

      {/* Slide-in detail drawer */}
      <StockDetailDrawer
        selectedStock={selectedStock}
        onClose={() => setSelectedStock(null)}
        companyDescription={companyDescription}
        isFetchingDescription={isFetchingDescription}
        isUpdatingDividends={isUpdatingDividends}
        dividendUpdateMsg={dividendUpdateMsg}
        onSyncDividends={syncStockDividends}
        lastYear={lastYear}
      />
    </div>
  );
}
