import React, { useState, useEffect, useMemo } from "react";
import {
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  FileText,
  FileDown,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Info,
  Sparkles,
  Award,
  ArrowRight,
  X,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockData, BRVMResponse, DividendHistory } from "./types";

export default function App() {
  const lastYear = new Date().getFullYear() - 1;

  // State variables
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [lastSync, setLastSync] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [brvm30Url, setBrvm30Url] = useState<string>("https://www.sikafinance.com/docs/brvm-30-composition-de-l-indice-brvm-30.pdf");
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [dividendFilter, setDividendFilter] = useState<"ALL" | "ELIGIBLE" | "INELIGIBLE">("ALL");
  
  // Sorting states
  const [sortField, setSortField] = useState<keyof StockData | "">("variation");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Selected stock for details drawer
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [isUpdatingDividends, setIsUpdatingDividends] = useState<boolean>(false);
  const [dividendUpdateMsg, setDividendUpdateMsg] = useState<string | null>(null);
  const [companyDescription, setCompanyDescription] = useState<string | null>(null);
  const [isFetchingDescription, setIsFetchingDescription] = useState<boolean>(false);

  // Bulletins feature states
  const [activeTab, setActiveTab] = useState<"STOCKS" | "BULLETINS">("STOCKS");
  const [bulletins, setBulletins] = useState<{ dateStr: string; dateCode: string; url: string }[]>([]);
  const [isLoadingBulletins, setIsLoadingBulletins] = useState<boolean>(false);
  const [selectedBulletin, setSelectedBulletin] = useState<{ dateStr: string; dateCode: string; url: string } | null>(null);
  const [bulletinAnalysis, setBulletinAnalysis] = useState<string | null>(null);
  const [bulletinSources, setBulletinSources] = useState<{ title: string; uri: string }[]>([]);
  const [isAnalyzingBulletin, setIsAnalyzingBulletin] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [bulletinLoadingStep, setBulletinLoadingStep] = useState<number>(0);

  useEffect(() => {
    if (selectedStock) {
      fetchCompanyDescription(selectedStock.symbol, selectedStock.country);
    } else {
      setCompanyDescription(null);
    }
  }, [selectedStock?.symbol]);

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

  // Bulletins feature effects and handlers
  useEffect(() => {
    if (activeTab === "BULLETINS" && bulletins.length === 0) {
      fetchBulletins();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedBulletin) {
      setBulletinAnalysis(null);
      setBulletinSources([]);
      setAnalysisError(null);
    }
  }, [selectedBulletin?.dateCode]);

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

  const runBulletinAnalysis = async (bulletin: { dateStr: string; dateCode: string; url: string }) => {
    if (isAnalyzingBulletin) return;
    setIsAnalyzingBulletin(true);
    setBulletinAnalysis(null);
    setBulletinSources([]);
    setAnalysisError(null);
    setBulletinLoadingStep(0);

    // Dynamic professional financial progress messages
    const stepInterval = setInterval(() => {
      setBulletinLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 3500);

    try {
      const res = await fetch(`/api/brvm/analyze-bulletin/${bulletin.dateCode}?url=${encodeURIComponent(bulletin.url)}`);
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

  // Status message state
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Fetch stocks on mount
  useEffect(() => {
    fetchStocks();
  }, []);

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
        
        // Update currently selected stock detail view if open
        if (selectedStock) {
          const updated = data.stocks.find(s => s.symbol === selectedStock.symbol);
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

  // Synchronize button action (triggers background sync and polls status)
  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    showStatus("Lancement de la synchronisation en arrière-plan...", "info");
    
    try {
      const res = await fetch("/api/brvm30/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showStatus("La synchronisation a démarré avec Sika Finance !", "success");
        // Poll for completion every 2 seconds
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          const checkRes = await fetch("/api/brvm30/stocks");
          const checkData = await checkRes.json();
          if (checkData.success) {
            setStocks(checkData.stocks);
            setLastSync(checkData.lastSync);
            
            if (!checkData.isSyncing || attempts > 15) {
              clearInterval(interval);
              setIsSyncing(false);
              showStatus("Mise à jour des cotations terminée avec succès !", "success");
            }
          }
        }, 2000);
      } else {
        setIsSyncing(false);
        showStatus(data.message || "Échec de l'initialisation de la synchronisation", "error");
      }
    } catch (err) {
      setIsSyncing(false);
      showStatus("Erreur lors de la tentative de synchronisation", "error");
    }
  };

  // Sync specific stock dividends
  const syncStockDividends = async (symbol: string) => {
    if (isUpdatingDividends) return;
    setIsUpdatingDividends(true);
    setDividendUpdateMsg("Récupération en direct de l'historique des dividendes...");
    
    try {
      const res = await fetch(`/api/brvm30/sync-dividends/${symbol}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDividendUpdateMsg("Historique des dividendes mis à jour avec succès !");
        // Refresh local list
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

  const showStatus = (text: string, type: "success" | "error" | "info") => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg(null);
    }, 5000);
  };

  // Filter country display list helper
  const countriesMap: Record<string, { name: string; flag: string }> = {
    ci: { name: "Côte d'Ivoire", flag: "🇨🇮" },
    sn: { name: "Sénégal", flag: "🇸🇳" },
    bf: { name: "Burkina Faso", flag: "🇧🇫" },
    bj: { name: "Bénin", flag: "🇧🇯" },
    tg: { name: "Togo", flag: "🇹🇬" },
    ml: { name: "Mali", flag: "🇲🇱" },
    ne: { name: "Niger", flag: "🇳🇪" }
  };

  // Memoized lists and stats to avoid unnecessary recalculations
  const processedStocks = useMemo(() => {
    return stocks.map(s => {
      // Return calculated properties
      return s;
    });
  }, [stocks]);

  // Index metrics calculations
  const stats = useMemo(() => {
    if (processedStocks.length === 0) {
      return { count: 0, averageVariation: 0, dividendEligibleCount: 0 };
    }
    const count = processedStocks.length;
    const totalVariation = processedStocks.reduce((sum, s) => sum + s.variation, 0);
    const averageVariation = totalVariation / count;
    // Eligible counts are companies that pay dividends since at least 3 years (streak >= 3)
    const dividendEligibleCount = processedStocks.filter(s => s.streak >= 3).length;
    
    return { count, averageVariation, dividendEligibleCount };
  }, [processedStocks]);

  // Handle table header sorting click
  const handleSort = (field: keyof StockData) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filtered and sorted list of stocks
  const filteredAndSortedStocks = useMemo(() => {
    let result = [...processedStocks];

    // Search filter
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        s =>
          s.symbol.toLowerCase().includes(lowerSearch) ||
          s.name.toLowerCase().includes(lowerSearch)
      );
    }

    // Country filter
    if (selectedCountry !== "ALL") {
      result = result.filter(s => s.country === selectedCountry.toLowerCase());
    }

    // Dividend eligibility filter
    if (dividendFilter === "ELIGIBLE") {
      result = result.filter(s => s.streak >= 3);
    } else if (dividendFilter === "INELIGIBLE") {
      result = result.filter(s => s.streak < 3);
    }

    // Sorting logic
    if (sortField !== "") {
      result.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Handle string comparison
        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        // Handle numeric comparison
        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        return 0;
      });
    }

    return result;
  }, [processedStocks, searchTerm, selectedCountry, dividendFilter, sortField, sortDirection]);

  // Dynamic counts for country badges (considers active search and dividend filters)
  const stocksFilteredByOthers = useMemo(() => {
    let result = [...processedStocks];

    // Search filter
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        s =>
          s.symbol.toLowerCase().includes(lowerSearch) ||
          s.name.toLowerCase().includes(lowerSearch)
      );
    }

    // Dividend eligibility filter
    if (dividendFilter === "ELIGIBLE") {
      result = result.filter(s => s.streak >= 3);
    } else if (dividendFilter === "INELIGIBLE") {
      result = result.filter(s => s.streak < 3);
    }

    return result;
  }, [processedStocks, searchTerm, dividendFilter]);

  // Formatter helpers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(price);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " (" + d.toLocaleDateString("fr-FR") + ")";
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans antialiased pb-12">
      {/* Banner message */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-[4px_4px_0px_#141414] border-2 border-[#141414] px-6 py-3 flex items-center space-x-3 text-xs font-bold uppercase tracking-wider font-mono ${
              statusMsg.type === "success"
                ? "bg-emerald-100 text-[#141414]"
                : statusMsg.type === "error"
                ? "bg-rose-100 text-[#141414]"
                : "bg-blue-100 text-[#141414]"
            }`}
          >
            <div className={`w-3 h-3 border border-[#141414] ${
              statusMsg.type === "success" ? "bg-emerald-500" : statusMsg.type === "error" ? "bg-rose-500" : "bg-blue-500"
            }`} />
            <span>{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header Block */}
        <header className="mb-8 bg-white border-2 border-[#141414] rounded-none p-6 sm:p-8 shadow-[6px_6px_0px_#141414] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <TrendingUp className="w-48 h-48 text-[#141414]" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="bg-emerald-100 text-[#141414] text-[10px] font-bold uppercase tracking-wider px-3 py-1 border border-[#141414] flex items-center space-x-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Source : Sika Finance</span>
                </span>
                <span className="text-xs text-[#141414]/60 font-mono">2026-07-10 (UTC)</span>
              </div>
              <h1 className="text-3xl font-black text-[#141414] uppercase tracking-tighter italic font-sans mb-1">
                Suivi de l'Indice BRVM 30
              </h1>
              <p className="text-[#141414]/70 text-xs font-mono max-w-2xl leading-relaxed">
                Suivez en temps réel les performances des 30 actions les plus dynamiques de la BRVM. 
                Vérifiez la régularité du versement des dividendes sur 5 ans grâce à l'analyseur Gemini AI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={brvm30Url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-[#141414] text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-none border-2 border-[#141414] shadow-[3px_3px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all duration-100"
                id="btn-brvm30-pdf"
              >
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Composition PDF</span>
              </a>

              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className={`inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-none shadow-[3px_3px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all duration-100 ${
                  isSyncing
                    ? "bg-[#141414]/20 text-[#141414]/50 border-2 border-[#141414]/30 cursor-not-allowed"
                    : "bg-[#141414] hover:bg-black text-[#E4E3E0] border-2 border-[#141414] cursor-pointer"
                }`}
                id="btn-sync-all"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-[#141414]/40" : "text-white"}`} />
                <span>{isSyncing ? "Synchronisation..." : "Synchroniser"}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#141414] flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono uppercase">
            <div className="flex items-center space-x-2 text-[#141414]/70">
              <span className="inline-block w-2.5 h-2.5 bg-green-500 border border-[#141414]" />
              <span>Mise à jour automatique toutes les 5 minutes</span>
            </div>
            <div className="text-[#141414]/60">
              Dernier import : <span className="text-[#141414] font-bold">{formatDate(lastSync)}</span>
            </div>
          </div>
        </header>

        {/* Navigation Switcher */}
        <div className="flex border-b-2 border-[#141414] mb-8 font-mono font-bold text-xs uppercase tracking-wider">
          <button
            onClick={() => setActiveTab("STOCKS")}
            className={`px-6 py-3.5 border-t-2 border-l-2 border-r-2 border-[#141414] transition-all duration-200 focus:outline-none ${
              activeTab === "STOCKS"
                ? "bg-white text-[#141414] border-b-2 border-b-white translate-y-[2px]"
                : "bg-[#E4E3E0]/40 text-[#141414]/60 hover:text-[#141414] hover:bg-[#E4E3E0]/70"
            }`}
          >
            📊 Suivi des Cotations
          </button>
          <button
            onClick={() => setActiveTab("BULLETINS")}
            className={`px-6 py-3.5 border-t-2 border-l-2 border-r-2 border-[#141414] ml-2 transition-all duration-200 focus:outline-none flex items-center space-x-2 relative ${
              activeTab === "BULLETINS"
                ? "bg-white text-[#141414] border-b-2 border-b-white translate-y-[2px]"
                : "bg-[#E4E3E0]/40 text-[#141414]/60 hover:text-[#141414] hover:bg-[#E4E3E0]/70"
            }`}
          >
            <span>📰 Bulletins de la Cote (BOC)</span>
            <span className="bg-rose-500 text-white font-sans text-[9px] font-bold px-1.5 py-0.5 animate-pulse">NOUVEAU</span>
          </button>
        </div>

        {activeTab === "STOCKS" ? (
          <>
            {/* Bento Metrics Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Stocks count */}
          <div className="bg-white border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_#141414] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider font-mono">Actions Suivies</span>
              <h3 className="text-3xl font-black font-mono text-[#141414] mt-1">{stats.count} / 30</h3>
              <p className="text-xs text-[#141414]/50 mt-1 font-mono">Composition officielle BRVM 30</p>
            </div>
            <div className="p-3 bg-slate-50 border-2 border-[#141414] rounded-none text-[#141414] shadow-[2px_2px_0px_#141414]">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Average variation (High contrast dark bento block) */}
          <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.15)] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#E4E3E0]/60 font-bold uppercase tracking-wider font-mono">Variation Moyenne</span>
              <div className="flex items-center mt-1 space-x-2">
                <span className={`text-3xl font-black font-mono ${stats.averageVariation >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {stats.averageVariation >= 0 ? "+" : ""}{stats.averageVariation.toFixed(2)}%
                </span>
                {stats.averageVariation >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <p className="text-xs text-[#E4E3E0]/50 mt-1 font-mono">Séance consolidée de l'indice</p>
            </div>
            <div className="p-3 bg-[#E4E3E0]/15 border border-[#E4E3E0]/30 rounded-none text-[#E4E3E0]">
              {stats.averageVariation >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
          </div>

          {/* Card 3: Dividends streak counts */}
          <div className="bg-white border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_#141414] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider font-mono">Aristocrates Dividendes</span>
              <h3 className="text-3xl font-black font-mono text-emerald-700 mt-1">{stats.dividendEligibleCount}</h3>
              <p className="text-xs text-[#141414]/50 mt-1 font-mono">Versements continus depuis ≥ 3 ans</p>
            </div>
            <div className="p-3 bg-emerald-50 border-2 border-[#141414] rounded-none text-emerald-700 shadow-[2px_2px_0px_#141414]">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Toolbar: Search, Country Filters, and Legend */}
        <section className="bg-white border-2 border-[#141414] rounded-none p-4 sm:p-6 shadow-[4px_4px_0px_#141414] mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]" />
              <input
                type="text"
                placeholder="Rechercher par symbole ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:ring-0 rounded-none py-2.5 pl-11 pr-4 text-xs font-mono text-[#141414] placeholder-[#141414]/50 outline-none transition-all duration-200"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/50 hover:text-[#141414]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dividend Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mr-2 font-mono">Dividendes :</span>
              <button
                onClick={() => setDividendFilter("ALL")}
                className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 ${
                  dividendFilter === "ALL"
                    ? "bg-[#141414] border-[#141414] text-[#E4E3E0]"
                    : "bg-white border-[#141414] text-[#141414] hover:bg-slate-50"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setDividendFilter("ELIGIBLE")}
                className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 ${
                  dividendFilter === "ELIGIBLE"
                    ? "bg-emerald-600 border-[#141414] text-white"
                    : "bg-white border-[#141414] text-emerald-800 hover:bg-emerald-50/50"
                }`}
              >
                <span className="w-1.5 h-1.5 bg-emerald-400 border border-[#141414]/30 rounded-full" />
                <span>Régulier (D ≥ 3 ans)</span>
              </button>
              <button
                onClick={() => setDividendFilter("INELIGIBLE")}
                className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 ${
                  dividendFilter === "INELIGIBLE"
                    ? "bg-amber-600 border-[#141414] text-white"
                    : "bg-white border-[#141414] text-amber-900 hover:bg-amber-50/50"
                }`}
              >
                <span className="w-1.5 h-1.5 bg-amber-400 border border-[#141414]/30 rounded-full" />
                <span>Irrégulier (D &lt; 3 ans)</span>
              </button>
            </div>
          </div>

          {/* Country Badges Filters */}
          <div className="mt-5 pt-4 border-t border-[#141414] flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mr-2 font-mono">Pays :</span>
            <button
              onClick={() => setSelectedCountry("ALL")}
              className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1 ${
                selectedCountry === "ALL"
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
              }`}
            >
              <span>🌍 Tous les marchés</span>
              <span className={`text-[9px] font-mono border rounded-none px-1.5 py-0.5 ml-1 ${
                selectedCountry === "ALL"
                  ? "bg-emerald-500/20 text-[#E4E3E0] border-[#E4E3E0]/30"
                  : "bg-[#141414]/10 text-[#141414] border-[#141414]/20"
              }`}>{stocksFilteredByOthers.length}</span>
            </button>
            {Object.entries(countriesMap).map(([code, data]) => {
              const countOfCountry = stocksFilteredByOthers.filter(s => s.country === code).length;
              return (
                <button
                  key={code}
                  onClick={() => setSelectedCountry(code.toUpperCase())}
                  className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1 ${
                    selectedCountry === code.toUpperCase()
                      ? "bg-emerald-100 text-[#141414] border-[#141414]"
                      : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
                  }`}
                >
                  <span>{data.flag}</span>
                  <span>{data.name}</span>
                  <span className="text-[9px] bg-[#141414]/10 text-[#141414] font-mono border border-[#141414]/20 rounded-none px-1.5 py-0.5 ml-1">{countOfCountry}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Actions Table */}
        <div className="bg-white border-2 border-[#141414] rounded-none shadow-[8px_8px_0px_#141414] overflow-hidden mb-8">
          {error && (
            <div className="p-6 text-center bg-rose-50 border-b-2 border-[#141414]">
              <div className="bg-rose-100 border-2 border-[#141414] text-[#141414] px-4 py-3 rounded-none inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider max-w-lg shadow-[3px_3px_0px_#141414]">
                <Info className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-wider border-b-2 border-[#141414] font-mono">
                  <th className="py-4 px-6 w-32 cursor-pointer select-none hover:bg-neutral-800 transition-colors" onClick={() => handleSort("symbol")}>
                    <div className="flex items-center space-x-1">
                      <span>Symbole</span>
                      {sortField === "symbol" ? (
                        sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 cursor-pointer select-none hover:bg-neutral-800 transition-colors" onClick={() => handleSort("name")}>
                    <div className="flex items-center space-x-1">
                      <span>Entreprise</span>
                      {sortField === "name" ? (
                        sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 w-28 cursor-pointer select-none hover:bg-neutral-800 transition-colors" onClick={() => handleSort("country")}>
                    <div className="flex items-center space-x-1">
                      <span>Pays</span>
                      {sortField === "country" ? (
                        sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right w-44 cursor-pointer select-none hover:bg-neutral-800 transition-colors" onClick={() => handleSort("currentPrice")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Prix actuel</span>
                      {sortField === "currentPrice" ? (
                        sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right w-36 cursor-pointer select-none hover:bg-neutral-800 transition-colors" onClick={() => handleSort("variation")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Variation</span>
                      {sortField === "variation" ? (
                        sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right w-36 cursor-pointer select-none hover:bg-neutral-800 transition-colors hidden sm:table-cell" onClick={() => handleSort("high")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Haut</span>
                      {sortField === "high" ? (
                        sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right w-36 cursor-pointer select-none hover:bg-neutral-800 transition-colors hidden sm:table-cell" onClick={() => handleSort("low")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Bas</span>
                      {sortField === "low" ? (
                        sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center w-52 cursor-pointer select-none hover:bg-neutral-800 transition-colors" onClick={() => handleSort("streak")}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Dividende (D)</span>
                      {sortField === "streak" ? (
                        sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/15 text-xs font-mono text-[#141414]">
                <AnimatePresence initial={false}>
                  {filteredAndSortedStocks.length > 0 ? (
                    filteredAndSortedStocks.map((stock) => {
                      const isUp = stock.variation > 0;
                      const isDown = stock.variation < 0;
                      const isEligible = stock.streak >= 3;
                      
                      return (
                        <motion.tr
                           key={stock.symbol}
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           onClick={() => setSelectedStock(stock)}
                           className={`hover:bg-[#141414]/5 transition-colors duration-150 cursor-pointer ${
                             selectedStock?.symbol === stock.symbol ? "bg-[#141414]/10 font-bold" : ""
                           }`}
                           id={`row-${stock.symbol}`}
                        >
                          {/* Symbol Column */}
                          <td className="py-3 px-6 font-mono font-bold text-slate-900">
                            <span className="bg-[#141414]/5 text-[#141414] px-2.5 py-1 border border-[#141414]/20 rounded-none text-xs font-bold">
                              {stock.symbol}
                            </span>
                          </td>

                          {/* Company Name Column */}
                          <td className="py-3 px-6">
                            <div className="flex flex-col">
                              <span className="text-[#141414] font-bold text-sm leading-tight font-sans">{stock.name}</span>
                              <span className="text-[#141414]/60 text-[10px] mt-0.5 font-mono">cotation_{stock.symbol}.{stock.country}</span>
                            </div>
                          </td>

                          {/* Country Column */}
                          <td className="py-3 px-6 text-[#141414]/70 font-bold text-xs uppercase">
                            <div className="flex items-center space-x-1.5">
                              <span>{countriesMap[stock.country]?.flag || "🌍"}</span>
                              <span>{countriesMap[stock.country]?.name || stock.country.toUpperCase()}</span>
                            </div>
                          </td>

                          {/* Current Price Column */}
                          <td className="py-3 px-6 text-right font-mono font-black text-sm text-[#141414]">
                            {formatPrice(stock.currentPrice)}
                          </td>

                          {/* Variation % Column */}
                          <td className="py-3 px-6 text-right font-mono">
                            <span className={`inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold border ${
                              isUp 
                                ? "bg-emerald-100 text-emerald-800 border-emerald-600/40" 
                                : isDown 
                                ? "bg-rose-100 text-rose-800 border-rose-600/40" 
                                : "bg-[#E4E3E0]/50 text-[#141414]/60 border-[#141414]/10"
                            }`}>
                              {isUp && "+"}
                              {stock.variation.toFixed(2)}%
                            </span>
                          </td>

                          {/* High Session Column */}
                          <td className="py-3 px-6 text-right font-mono text-xs text-[#141414]/60 hidden sm:table-cell">
                            {formatPrice(stock.high)}
                          </td>

                          {/* Low Session Column */}
                          <td className="py-3 px-6 text-right font-mono text-xs text-[#141414]/60 hidden sm:table-cell">
                            {formatPrice(stock.low)}
                          </td>

                          {/* Dividends Badge Score Column */}
                          <td className="py-3 px-6 text-center">
                            {isEligible ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-3 py-1 rounded-none border border-emerald-700 flex items-center space-x-1 shadow-[1px_1px_0px_rgba(0,0,0,0.15)]">
                                  <span>D</span>
                                  <span className="bg-emerald-700 text-[#E4E3E0] font-mono px-1 rounded-none text-[9px]">{stock.streak}/5</span>
                                </span>
                                <span className="text-[11px] text-[#141414] font-mono font-bold mt-1">
                                  {formatPrice(stock.latestDividend)}
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span className="bg-[#E4E3E0]/50 text-[#141414]/50 text-[10px] font-bold px-2.5 py-1 rounded-none border border-[#141414]/20">
                                  0/5
                                </span>
                                <span className="text-[9px] text-[#141414]/40 font-mono mt-1 uppercase">
                                  Non éligible
                                </span>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#141414]/50 font-bold uppercase tracking-wider font-sans">
                        Aucun résultat ne correspond à vos filtres.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend Panel */}
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
                  <strong className="text-[#141414] font-black">Badge Vert "D" (Score ≥ 3/5) :</strong> Attribué uniquement aux entreprises ayant versé des dividendes de manière ininterrompue depuis au moins 3 ans en partant du dernier exercice clos ({lastYear}).
                </span>
              </p>
              <p className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-[#141414] rotate-45 mt-1.5 flex-shrink-0" />
                <span>
                  <strong className="text-[#141414] font-black">Exemple de score 3/5 :</strong> Si des dividendes sont payés de manière continue en <strong className="text-[#141414] font-black">{lastYear}, {lastYear - 1} et {lastYear - 2}</strong>, l'entreprise se qualifie avec la mention <strong className="text-[#141414] font-black">3/5</strong>.
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rotate-45 mt-1.5 flex-shrink-0" />
                <span>
                  <strong className="text-[#141414] font-black">Mention "0/5" (Non Éligible) :</strong> Attribuée si le cycle de versement consécutif est inférieur à 3 ans, ou s'il est rompu pour l'année {lastYear}.
                </span>
              </p>
              <p className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rotate-45 mt-1.5 flex-shrink-0" />
                <span>
                  <strong className="text-[#141414] font-black">Exemple de score 0/5 :</strong> Si l'entreprise verse des dividendes en {lastYear - 1}, {lastYear - 2}, mais que le versement pour <strong className="text-[#141414] font-black">{lastYear} est manquant</strong>, le score retombe à <strong className="text-[#141414] font-black">0/5</strong>.
                </span>
              </p>
            </div>
          </div>
        </section>
      </>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 animate-fade-in">
        {/* Left Column: list of bulletins (col-span-4) */}
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
                      onClick={() => setSelectedBulletin(bulletin)}
                      className={`p-3.5 border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[3px_3px_0px_rgba(0,0,0,0.15)]"
                          : "bg-white hover:bg-slate-50 text-[#141414] border-[#141414] shadow-[2px_2px_0px_#141414]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-1.5 mb-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                              isSelected ? "bg-[#E4E3E0]/20 border-[#E4E3E0]/30 text-white" : "bg-slate-100 border-[#141414]/20 text-[#141414]"
                            } font-mono`}>
                              PDF
                            </span>
                            <span className={`text-[9px] font-mono ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
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
                            isSelected ? "border-[#E4E3E0]/30 hover:bg-[#E4E3E0]/15 text-white" : "border-[#141414]/20 hover:bg-slate-100 text-[#141414]"
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
              onClick={fetchBulletins}
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
              <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">Pourquoi analyser le BOC ?</h4>
            </div>
            <ul className="space-y-3 text-[11px] font-mono leading-relaxed text-[#E4E3E0]/80">
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 mt-0.5 font-bold">»</span>
                <span><strong className="text-white">Indices sectoriels :</strong> Suivez les forces motrices des secteurs (Finance, Services Publics, etc.) plutôt que de simples actions isolées.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 mt-0.5 font-bold">»</span>
                <span><strong className="text-white">Marché Obligataire :</strong> Obtenez les taux réels et rendements des emprunts d'État souverains.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-400 mt-0.5 font-bold">»</span>
                <span><strong className="text-white">Opérations de Blocs :</strong> Repérez les transferts de parts stratégiques par les grands institutionnels.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Bulletin Analysis display (col-span-8) */}
        <div className="lg:col-span-8">
          {selectedBulletin ? (
            <div className="bg-white border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_#141414] min-h-[550px] flex flex-col justify-between animate-fade-in">
              <div>
                {/* Header of analysis card */}
                <div className="border-b-2 border-[#141414] pb-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="bg-amber-100 text-[#141414] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[#141414] font-mono">
                        Séance du Jour
                      </span>
                      <span className="text-[10px] text-[#141414]/60 font-mono">BOC_{selectedBulletin.dateCode}</span>
                    </div>
                    <h2 className="text-xl font-black text-[#141414] uppercase tracking-tight font-sans italic">
                      {selectedBulletin.dateStr}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={selectedBulletin.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-[#E4E3E0]/30 hover:bg-[#E4E3E0]/50 text-[#141414] text-[10px] font-bold uppercase tracking-wider py-2 px-3 border border-[#141414] font-mono"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>PDF d'Origine</span>
                    </a>

                    {!bulletinAnalysis && !isAnalyzingBulletin && (
                      <button
                        onClick={() => runBulletinAnalysis(selectedBulletin)}
                        className="inline-flex items-center space-x-1.5 bg-[#141414] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 border border-[#141414] font-mono shadow-[2px_2px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lancer l'analyse IA</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Analysis Content */}
                {isAnalyzingBulletin ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-[#141414] border-t-amber-500 rounded-full animate-spin" />
                      <Sparkles className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2 max-w-md">
                      <h4 className="text-xs font-black uppercase font-mono tracking-wider text-[#141414]">
                        Analyse en cours avec Gemini
                      </h4>
                      <p className="text-[11px] font-mono text-amber-700 font-bold bg-amber-50 border border-amber-200 px-4 py-2 transition-all">
                        {bulletinLoadingStep === 0 && "🔍 Scraping en cours du Bulletin Officiel de la Cote..."}
                        {bulletinLoadingStep === 1 && "📈 Analyse des indices BRVM Composite, Prestige et BRVM 30..."}
                        {bulletinLoadingStep === 2 && "📊 Extraction de la capitalisation globale et volumes d'échanges..."}
                        {bulletinLoadingStep === 3 && "💸 Identification des détachements de dividendes & émissions d'obligations..."}
                        {bulletinLoadingStep >= 4 && "⚡ Synthèse du rapport financier global..."}
                      </p>
                      <p className="text-[10px] text-[#141414]/50 leading-relaxed font-mono">
                        Grâce au Google Grounding, l'IA effectue des recherches en temps réel pour corroborer et enrichir les informations officielles du bulletin du {selectedBulletin.dateStr}.
                      </p>
                    </div>
                  </div>
                ) : analysisError ? (
                  <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-none font-mono text-xs text-rose-800 space-y-3">
                    <div className="font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Une erreur est survenue lors de l'analyse</span>
                    </div>
                    <p>{analysisError}</p>
                    <button
                      onClick={() => runBulletinAnalysis(selectedBulletin)}
                      className="bg-white border border-rose-400 px-3 py-1.5 text-[10px] font-bold text-rose-900 uppercase tracking-wider hover:bg-rose-100 transition-all"
                    >
                      Réessayer l'analyse
                    </button>
                  </div>
                ) : bulletinAnalysis ? (
                  <div className="space-y-6">
                    <div className="prose prose-sm max-w-none text-[#141414]">
                      <div className="text-[12px] font-sans leading-relaxed whitespace-pre-line text-[#141414]/90 bg-slate-50 border-2 border-[#141414] p-5 shadow-[3px_3px_0px_#141414] rounded-none">
                        {bulletinAnalysis}
                      </div>
                    </div>

                    {/* Grounding Sources */}
                    {bulletinSources.length > 0 && (
                      <div className="border-t border-[#141414]/10 pt-4 mt-6">
                        <h4 className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mb-2.5 font-mono flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Sources vérifiées et croisées par l'IA :</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {bulletinSources.map((source, idx) => (
                            <a
                              key={idx}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-[#141414] border border-[#141414] px-2.5 py-1 text-[10px] font-mono tracking-tight"
                            >
                              <span className="w-1 h-1 bg-[#141414] rounded-full" />
                              <span className="truncate max-w-[200px]">{source.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4 border-2 border-dashed border-[#141414]/10 bg-slate-50">
                    <Sparkles className="w-10 h-10 text-amber-500" />
                    <div className="text-center space-y-1.5">
                      <h4 className="text-xs font-black uppercase font-mono text-[#141414]">
                        Aucune analyse générée pour cette séance
                      </h4>
                      <p className="text-[11px] text-[#141414]/60 max-w-sm mx-auto font-mono leading-relaxed">
                        Cliquez sur le bouton ci-dessous pour démarrer l'agent d'analyse financière intelligent avec Gemini.
                      </p>
                    </div>
                    <button
                      onClick={() => runBulletinAnalysis(selectedBulletin)}
                      className="inline-flex items-center space-x-1.5 bg-[#141414] hover:bg-black text-[#E4E3E0] text-[10px] font-bold uppercase tracking-wider py-2.5 px-5 border-2 border-[#141414] shadow-[3px_3px_0px_#141414] font-mono active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Démarrer l'analyse de séance</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Disclaimer banner */}
              <div className="mt-8 pt-4 border-t border-[#141414]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-mono text-[#141414]/50">
                <span>Avertissement : Les analyses financières IA sont des synthèses automatisées et ne constituent pas des conseils d'investissement.</span>
                <span className="font-bold text-[#141414]/70">Antigravity Trading Agent 2.5</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 border-2 border-dashed border-[#141414]/20 rounded-none h-full flex flex-col items-center justify-center py-32 text-[#141414]/60 font-mono text-xs">
              <span>Sélectionnez un bulletin dans la colonne de gauche pour l'analyser.</span>
            </div>
          )}
        </div>
      </div>
    )}
  </div>

      {/* Sidebar Detail Drawer */}
      <AnimatePresence>
        {selectedStock && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStock(null)}
              className="fixed inset-0 bg-[#141414] z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white border-l-4 border-[#141414] shadow-2xl z-50 overflow-y-auto flex flex-col font-mono text-xs text-[#141414]"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b-2 border-[#141414] flex items-center justify-between bg-[#E4E3E0]/40">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white border-2 border-[#141414] rounded-none shadow-[2px_2px_0px_#141414] text-[#141414]">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded-none font-mono font-bold">
                        {selectedStock.symbol}
                      </span>
                      <span>{countriesMap[selectedStock.country]?.flag}</span>
                    </div>
                    <h2 className="text-base font-black text-[#141414] mt-0.5 leading-tight font-sans uppercase">{selectedStock.name}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStock(null)}
                  className="p-2 text-[#141414] hover:bg-[#141414]/10 rounded-none transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 flex-1 space-y-6">
                
                {/* Company Description Box */}
                <div className="bg-white border-2 border-[#141414] p-4 rounded-none shadow-[3px_3px_0px_#141414] text-xs">
                  <h4 className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider block mb-2 font-mono">Description de l'entreprise</h4>
                  {isFetchingDescription ? (
                    <div className="flex items-center space-x-2 text-[#141414]/60 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-mono">Chargement de la description officielle...</span>
                    </div>
                  ) : companyDescription ? (
                    <p className="text-[#141414] font-sans leading-relaxed text-[11px] whitespace-pre-line">
                      {companyDescription}
                    </p>
                  ) : (
                    <p className="text-[#141414]/60 font-mono py-1">
                      Impossible de charger la description de cette entreprise.
                    </p>
                  )}
                </div>

                {/* Financial Summary Bento */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#E4E3E0]/30 border-2 border-[#141414] p-4 rounded-none shadow-[3px_3px_0px_#141414]">
                    <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider block">Dernier Cours</span>
                    <span className="text-xl font-bold text-[#141414] font-mono block mt-1">
                      {formatPrice(selectedStock.currentPrice)}
                    </span>
                    <span className={`text-[10px] font-mono font-bold inline-block mt-1 px-1.5 py-0.5 border border-[#141414]/20 rounded-none ${
                      selectedStock.variation > 0 
                        ? "bg-emerald-100 text-emerald-800" 
                        : selectedStock.variation < 0 
                        ? "bg-rose-100 text-rose-800" 
                        : "bg-[#E4E3E0] text-[#141414]"
                    }`}>
                      {selectedStock.variation > 0 && "+"}
                      {selectedStock.variation.toFixed(2)}%
                    </span>
                  </div>

                  <div className="bg-[#E4E3E0]/30 border-2 border-[#141414] p-4 rounded-none shadow-[3px_3px_0px_#141414]">
                    <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider block">Dernier Dividende</span>
                    <span className="text-xl font-bold text-[#141414] font-mono block mt-1">
                      {formatPrice(selectedStock.latestDividend)}
                    </span>
                    <span className="text-[9px] text-[#141414]/50 block mt-1.5 uppercase font-semibold">
                      (Exercice clos {lastYear})
                    </span>
                  </div>
                </div>

                {/* Session High / Low Metrics */}
                <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] rounded-none p-4 flex justify-between items-center text-xs font-mono shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
                  <div className="text-center flex-1 border-r border-[#E4E3E0]/20">
                    <span className="text-[9px] text-[#E4E3E0]/60 font-bold uppercase block">Plus haut</span>
                    <span className="text-sm font-bold text-white mt-1 block">{formatPrice(selectedStock.high)}</span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="text-[9px] text-[#E4E3E0]/60 font-bold uppercase block">Plus bas</span>
                    <span className="text-sm font-bold text-white mt-1 block">{formatPrice(selectedStock.low)}</span>
                  </div>
                </div>

                {/* Eligibility status box */}
                <div className={`p-4 rounded-none border-2 flex items-start space-x-3 ${
                  selectedStock.streak >= 3 
                    ? "bg-emerald-50 border-emerald-700 text-emerald-950" 
                    : "bg-amber-50 border-amber-700 text-amber-950"
                }`}>
                  <div className="mt-0.5 flex-shrink-0">
                    {selectedStock.streak >= 3 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <XCircle className="w-5 h-5 text-amber-700" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wide">
                      {selectedStock.streak >= 3 ? "Mention : Éligible Dividendes" : "Mention : Non Éligible"}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed">
                      {selectedStock.streak >= 3 
                        ? `Cette entreprise verse des dividendes de manière régulière depuis ${selectedStock.streak} ans consécutifs.`
                        : selectedStock.dividends.find(d => d.year === lastYear)?.paid === false
                        ? `Cette entreprise n'est pas éligible car elle n'a pas versé de dividendes en ${lastYear} (année de référence).`
                        : `Cette entreprise n'est pas éligible car son cycle continu de versement consécutif à partir de ${lastYear} est inférieur à 3 ans.`
                      }
                    </p>
                  </div>
                </div>

                {/* Dividend history table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#141414]/60">Historique complet (5 ans)</h3>
                    <span className="text-[9px] bg-[#141414] text-[#E4E3E0] font-bold px-2.5 py-0.5 rounded-none">
                      Score : {selectedStock.streak}/5
                    </span>
                  </div>

                  <div className="border-2 border-[#141414] rounded-none overflow-hidden shadow-[3px_3px_0px_#141414]">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-[#141414] text-[#E4E3E0] uppercase font-bold text-[10px]">
                          <th className="py-2.5 px-4">Année</th>
                          <th className="py-2.5 px-4 text-center">Statut de versement</th>
                          <th className="py-2.5 px-4 text-right">Montant brut / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/10">
                        {selectedStock.dividends.map((div) => (
                          <tr key={div.year} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#141414] font-mono">{div.year}</td>
                            <td className="py-3 px-4 text-center">
                              {div.paid ? (
                                <span className="inline-flex items-center bg-emerald-100 text-emerald-800 border border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-none font-mono">
                                  <span>Versé</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center bg-rose-100 text-rose-800 border border-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-none font-mono">
                                  <span>Non versé</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#141414]/80">
                              {div.paid ? formatPrice(div.amount) : "0 FCFA"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dividend visual bar chart */}
                <div className="bg-[#E4E3E0]/30 border-2 border-[#141414] rounded-none p-4 shadow-[3px_3px_0px_#141414]">
                  <h4 className="text-[10px] font-bold text-[#141414]/60 uppercase tracking-wider mb-3">Progression du dividende</h4>
                  <div className="space-y-2.5">
                    {selectedStock.dividends.map((div) => {
                      // Calculate width percentage based on max amount in list
                      const maxAmount = Math.max(...selectedStock.dividends.map(d => d.amount), 1);
                      const pct = (div.amount / maxAmount) * 100;
                      return (
                        <div key={div.year} className="flex items-center space-x-3 text-[11px]">
                          <span className="w-10 font-bold font-mono text-[#141414]/60">{div.year}</span>
                          <div className="flex-1 bg-white border border-[#141414]/20 h-4 rounded-none overflow-hidden relative">
                            {div.paid && (
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full"
                              />
                            )}
                          </div>
                          <span className="w-18 text-right font-mono text-[#141414] font-bold">
                            {div.paid ? `${div.amount} F` : "0 F"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Link to detail page info */}
                <div className="text-[10px] text-[#141414]/70 bg-white border-2 border-dashed border-[#141414] p-3 rounded-none leading-relaxed flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-[#141414]/60 mt-0.5 flex-shrink-0" />
                  <span>
                    Les dividendes sont calculés pour chaque exercice budgétaire.
                    Vous pouvez visiter la page officielle de cotation de Sika Finance : <br/>
                    <a 
                      href={`https://www.sikafinance.com/marches/cotation_${selectedStock.symbol}.${selectedStock.country}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-emerald-700 font-bold underline hover:text-emerald-800"
                    >
                      sikafinance.com/marches/cotation_{selectedStock.symbol}.{selectedStock.country}
                    </a>
                  </span>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t-2 border-[#141414] bg-[#E4E3E0]/30 space-y-3">
                <button
                  onClick={() => syncStockDividends(selectedStock.symbol)}
                  disabled={isUpdatingDividends}
                  className={`w-full py-3 bg-[#141414] hover:bg-black text-[#E4E3E0] rounded-none border-2 border-[#141414] font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all duration-100 ${
                    isUpdatingDividends ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                  id={`btn-sync-div-${selectedStock.symbol}`}
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdatingDividends ? "animate-spin" : ""}`} />
                  <span>{isUpdatingDividends ? "Recherche en cours..." : "Recharger l'historique officiel"}</span>
                </button>
                {dividendUpdateMsg && (
                  <p className="text-center text-[10px] font-bold text-emerald-800 uppercase font-sans">
                    {dividendUpdateMsg}
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
