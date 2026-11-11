'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Send,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Calendar,
  ChevronRight,
  X,
  Share2,
  Timer,
  ShieldCheck,
  GraduationCap,
  Award,
  Sparkle,
  Star,
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Job, JobsResponse, ApplicationStage, SavedJobTracking } from '@/types/job';

const STORAGE_KEY = 'vagas_the_timon_favoritos_v1';

const APPLICATION_STAGES: {
  id: ApplicationStage;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
  icon: string;
  description: string;
}[] = [
  { id: 'salva', label: 'Quero Candidatar', badgeBg: 'bg-amber-50', badgeBorder: 'border-amber-300', badgeText: 'text-amber-800', dotColor: 'bg-amber-500', icon: '⭐', description: 'Salva para enviar currículo' },
  { id: 'enviado', label: 'Currículo Enviado', badgeBg: 'bg-blue-50', badgeBorder: 'border-blue-300', badgeText: 'text-blue-800', dotColor: 'bg-blue-500', icon: '📨', description: 'Candidatura já enviada' },
  { id: 'teste', label: 'Teste / Case', badgeBg: 'bg-purple-50', badgeBorder: 'border-purple-300', badgeText: 'text-purple-800', dotColor: 'bg-purple-500', icon: '📝', description: 'Fazendo teste técnico ou comportamental' },
  { id: 'entrevista', label: 'Em Entrevista', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-300', badgeText: 'text-emerald-800', dotColor: 'bg-emerald-500', icon: '🗣️', description: 'Entrevista agendada ou realizada' },
  { id: 'aguardando', label: 'Aguardando Retorno', badgeBg: 'bg-orange-50', badgeBorder: 'border-orange-300', badgeText: 'text-orange-800', dotColor: 'bg-orange-500', icon: '⏳', description: 'Esperando retorno do RH / Gestor' },
  { id: 'aprovado', label: 'Aprovada!', badgeBg: 'bg-green-100', badgeBorder: 'border-green-400', badgeText: 'text-green-900', dotColor: 'bg-green-600', icon: '🎉', description: 'Proposta recebida / Selecionada!' },
  { id: 'encerrado', label: 'Encerrado', badgeBg: 'bg-slate-100', badgeBorder: 'border-slate-300', badgeText: 'text-slate-700', dotColor: 'bg-slate-400', icon: '❌', description: 'Processo encerrado ou não selecionada' },
];

const AREAS = [
  'all',
  'Comercial & Vendas',
  'Atendimento & Recepção',
  'Administrativo & Financeiro',
  'TI & Tecnologia',
  'Varejo & Supermercado',
  'Logística & Operacional',
  'Saúde & Cuidados',
  'Marketing & Criação',
  'Educação',
];

export default function Home() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Main Tab Navigation: Feed or Favoritos
  const [mainTab, setMainTab] = useState<'feed' | 'favoritos'>('feed');

  // Favorites & Process Tracking state
  const [savedJobs, setSavedJobs] = useState<Record<number, SavedJobTracking>>({});
  const [savedStageFilter, setSavedStageFilter] = useState<'all' | ApplicationStage>('all');
  const [savedSearchQuery, setSavedSearchQuery] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<'all' | 'Teresina' | 'Timon'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [onlyWithSalary, setOnlyWithSalary] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [onlyGestaoComercial, setOnlyGestaoComercial] = useState(false);

  // Modal state
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);

  // Fetch jobs from internal API
  const loadJobs = async (force = false, silent = false) => {
    try {
      if (!silent) {
        if (force) setRefreshing(true);
        else setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      if (force) params.append('refresh', '1');
      if (includeExpired) params.append('includeExpired', 'true');

      const url = `/api/vagas?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Não foi possível carregar as vagas.');

      const json: JobsResponse = await res.json();
      setData(json);
      setLastSyncTime(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err: any) {
      console.error(err);
      if (!silent) setError(err.message || 'Erro ao carregar vagas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [includeExpired]);

  // Background Auto-Sync every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs(true, true);
    }, 60000);
    return () => clearInterval(interval);
  }, [includeExpired]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (activeJob) {
      document.body.style.overflow = 'hidden';
      setCopiedCoverLetter(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeJob]);

  // Load saved jobs from localStorage on client mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setSavedJobs(parsed);
        }
      }
    } catch (e) {
      console.error('Erro ao ler favoritos do localStorage:', e);
    }
  }, []);

  // Save to localStorage helper
  const saveToLocalStorage = (newSaved: Record<number, SavedJobTracking>) => {
    setSavedJobs(newSaved);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved));
    } catch (e) {
      console.error('Erro ao salvar favoritos no localStorage:', e);
    }
  };

  // Toggle favorite / saved state
  const handleToggleFavorite = (job: Job, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existing = savedJobs[job.id];
    if (existing) {
      const updated = { ...savedJobs };
      delete updated[job.id];
      saveToLocalStorage(updated);
    } else {
      const updated: Record<number, SavedJobTracking> = {
        ...savedJobs,
        [job.id]: {
          jobId: job.id,
          stage: 'salva',
          notes: '',
          updatedAt: new Date().toISOString(),
          jobSnapshot: job,
        },
      };
      saveToLocalStorage(updated);
    }
  };

  // Update tracking details (stage, notes, dates)
  const handleUpdateTracking = (
    jobId: number,
    updates: Partial<Omit<SavedJobTracking, 'jobId' | 'jobSnapshot'>>,
    jobFallback?: Job
  ) => {
    const current = savedJobs[jobId];
    const job = current?.jobSnapshot || jobFallback;
    if (!job) return;

    const updated: Record<number, SavedJobTracking> = {
      ...savedJobs,
      [jobId]: {
        jobId,
        stage: updates.stage ?? current?.stage ?? 'salva',
        notes: updates.notes !== undefined ? updates.notes : (current?.notes ?? ''),
        appliedDate: updates.appliedDate ?? current?.appliedDate,
        interviewDate: updates.interviewDate ?? current?.interviewDate,
        updatedAt: new Date().toISOString(),
        jobSnapshot: job,
      },
    };
    saveToLocalStorage(updated);
  };

  // Remove from favorites
  const handleRemoveFavorite = (jobId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = { ...savedJobs };
    delete updated[jobId];
    saveToLocalStorage(updated);
  };

  // Memoized saved list
  const savedList = useMemo(() => {
    return Object.values(savedJobs).sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [savedJobs]);

  // Saved statistics by stage
  const savedStats = useMemo(() => {
    return {
      total: savedList.length,
      salva: savedList.filter((s) => s.stage === 'salva').length,
      enviado: savedList.filter((s) => s.stage === 'enviado').length,
      teste: savedList.filter((s) => s.stage === 'teste').length,
      entrevista: savedList.filter((s) => s.stage === 'entrevista').length,
      aguardando: savedList.filter((s) => s.stage === 'aguardando').length,
      aprovado: savedList.filter((s) => s.stage === 'aprovado').length,
      encerrado: savedList.filter((s) => s.stage === 'encerrado').length,
    };
  }, [savedList]);

  // Filtered saved list
  const filteredSavedList = useMemo(() => {
    return savedList.filter((item) => {
      if (savedStageFilter !== 'all' && item.stage !== savedStageFilter) {
        return false;
      }
      if (savedSearchQuery.trim()) {
        const q = savedSearchQuery.toLowerCase().trim();
        const j = item.jobSnapshot;
        const searchable = `${j.title} ${j.role} ${j.area} ${j.city} ${item.notes || ''}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [savedList, savedStageFilter, savedSearchQuery]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return [];

    return data.jobs.filter((job) => {
      // Expiration check
      if (!includeExpired && job.isExpired) return false;

      // Gestão Comercial exclusive toggle
      if (onlyGestaoComercial && !job.isGestaoComercial) return false;

      // City check
      if (selectedCity === 'Teresina' && !job.city.includes('Teresina')) return false;
      if (selectedCity === 'Timon' && !job.city.includes('Timon')) return false;

      // Type check
      if (selectedType !== 'all' && job.jobType !== selectedType) return false;

      // Area check
      if (selectedArea !== 'all' && job.area !== selectedArea) return false;

      // Salary check
      if (onlyWithSalary && !job.hasSalaryInfo) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchable = `${job.title} ${job.role} ${job.area} ${job.salary} ${job.schedule} ${job.requirements.join(
          ' '
        )} ${job.activities.join(' ')}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [data, selectedCity, selectedType, selectedArea, onlyWithSalary, searchQuery, includeExpired, onlyGestaoComercial]);

  // Copy email to clipboard
  const handleCopyEmail = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.application.email) return;

    navigator.clipboard.writeText(job.application.email);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Generate personalized cover letter for Gestão Comercial
  const generateGestaoCoverLetter = (job: Job) => {
    return `Olá, prezada equipe de recrutamento!\n\nMe chamo e sou graduada em Gestão Comercial. Gostaria de manifestar meu forte interesse na oportunidade para ${job.role} em ${job.city}.\n\nPossuo sólida formação em planejamento comercial, gestão de metas, negociação, atendimento a clientes e inteligência de vendas. Tenho total disponibilidade para contribuir com o crescimento da empresa e superar os resultados esperados.\n\nSegue em anexo meu currículo completo para análise. Agradeço desde já pela atenção e fico à disposição para entrevista.\n\nAtenciosamente.`;
  };

  const handleCopyCoverLetter = (job: Job) => {
    const text = generateGestaoCoverLetter(job);
    navigator.clipboard.writeText(text);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 3000);
  };

  // Share job via WhatsApp
  const handleShare = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Olha essa vaga de *${job.role}* em *${job.city}*:\nSalário: ${job.salary}\nConfira e candidate-se: https://vagas-the-timon.vercel.app/#vaga-${job.id}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-lg sm:text-xl tracking-tighter shrink-0">
              THE
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight truncate">
                  Vagas THE & Timon
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ao Vivo
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">
                Teresina (PI) e Timon (MA) • Vagas reais atualizadas
              </p>
            </div>
          </div>

          {/* Sync Status & Action */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Timer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sync a cada 60s {lastSyncTime && `(${lastSyncTime})`}</span>
            </div>

            <button
              onClick={() => loadJobs(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-xs"
              title="Sincronizar novas vagas agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* View Switcher Tabs: Feed vs Minhas Candidaturas */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto py-1">
            <button
              onClick={() => setMainTab('feed')}
              className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                mainTab === 'feed'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Vagas Disponíveis</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-semibold">
                {data?.total ?? 0}
              </span>
            </button>

            <button
              onClick={() => setMainTab('favoritos')}
              className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                mainTab === 'favoritos'
                  ? 'border-amber-500 text-amber-900 bg-amber-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Star
                className={`w-4 h-4 ${
                  savedList.length > 0 ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                }`}
              />
              <span>Minhas Candidaturas</span>
              {savedList.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500 text-white font-bold animate-in fade-in">
                  {savedList.length}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500 font-semibold">
                  0
                </span>
              )}
            </button>
          </div>

          {mainTab === 'favoritos' && savedList.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 shrink-0">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Salvo no navegador (offline e privado)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {mainTab === 'feed' && (
          <>
            {/* Special Banner Gestão Comercial */}
        <div className="max-w-3xl mx-auto mb-6">
          <button
            onClick={() => {
              setOnlyGestaoComercial(!onlyGestaoComercial);
              if (!onlyGestaoComercial) {
                setSelectedArea('all');
              }
            }}
            className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 shadow-xs active:scale-[0.99] ${
              onlyGestaoComercial
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-400 ring-4 ring-orange-400/20 shadow-md'
                : 'bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50/30 text-amber-950 border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  onlyGestaoComercial ? 'bg-white/20 text-white' : 'bg-amber-500 text-white shadow-sm'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base tracking-tight">
                    Filtro Especial: Perfil Gestão Comercial
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
                      onlyGestaoComercial
                        ? 'bg-white text-orange-600'
                        : 'bg-amber-200/80 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {data?.stats.gestaoComercial ?? 0} vagas compatíveis
                  </span>
                </div>
                <p
                  className={`text-xs mt-0.5 truncate sm:whitespace-normal ${
                    onlyGestaoComercial ? 'text-orange-100' : 'text-amber-800'
                  }`}
                >
                  Supervisão, Coordenação, Analista, Consultor(a) e Vendas B2B ideais para graduados na área.
                </p>
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                onlyGestaoComercial ? 'bg-white text-orange-700 shadow-sm' : 'bg-amber-600 text-white shadow-xs'
              }`}
            >
              {onlyGestaoComercial ? 'Ativo ✓' : 'Ativar Filtro'}
            </div>
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200 mb-3 sm:mb-4">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>Vagas vencidas são filtradas automaticamente</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-2 sm:mb-4 leading-tight">
            Empregos em{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Teresina & Timon
            </span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-base mb-4 sm:mb-6 px-2">
            Todas as informações diretas, sem propagandas. Candidatura com 1 clique por E-mail ou WhatsApp.
          </p>

          {/* Metrics */}
          {data?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto mb-5 sm:mb-8">
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 text-center shadow-xs">
                <span className="block text-xl sm:text-2xl font-black text-emerald-600">{data.stats.total}</span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Vagas no Prazo</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 text-center shadow-xs">
                <span className="block text-xl sm:text-2xl font-black text-cyan-600">{data.stats.teresina}</span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">📍 Teresina</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 text-center shadow-xs">
                <span className="block text-xl sm:text-2xl font-black text-amber-600">{data.stats.timon}</span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">📍 Timon</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 text-center shadow-xs">
                <span className="block text-xl sm:text-2xl font-black text-indigo-600">{data.stats.estagios}</span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">🎓 Estágios</span>
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto px-1 sm:px-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cargo, área, requisitos (ex: Vendedor, TI, Estágio)..."
              className="w-full pl-10 sm:pl-12 pr-9 sm:pr-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 placeholder-slate-400 text-sm sm:text-base outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Box */}
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-6 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* City Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs w-full sm:w-auto">
              <button
                onClick={() => setSelectedCity('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'all'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({data?.stats.total ?? 0})
              </button>
              <button
                onClick={() => setSelectedCity('Teresina')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'Teresina'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📍 Teresina ({data?.stats.teresina ?? 0})
              </button>
              <button
                onClick={() => setSelectedCity('Timon')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'Timon'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📍 Timon ({data?.stats.timon ?? 0})
              </button>
            </div>

            {/* Checkbox Options */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyWithSalary}
                  onChange={(e) => setOnlyWithSalary(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600"
                />
                <span>Com salário 💰</span>
              </label>

              {data?.stats.expiradasFiltradas ? (
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={includeExpired}
                    onChange={(e) => setIncludeExpired(e.target.checked)}
                    className="rounded border-slate-300 text-slate-600 focus:ring-slate-400 w-4 h-4"
                  />
                  <span>Ver {data.stats.expiradasFiltradas} expiradas</span>
                </label>
              ) : null}
            </div>
          </div>

          {/* Type Badges */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar pb-1">
            {['all', 'CLT', 'Estágio', 'Home Office', 'Jovem Aprendiz', 'Diarista'].map((typeKey) => (
              <button
                key={typeKey}
                onClick={() => setSelectedType(typeKey)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                  selectedType === typeKey
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {typeKey === 'all' ? 'Todos os tipos' : typeKey}
              </button>
            ))}
          </div>

          {/* Area Badges */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar pb-1">
            {AREAS.map((areaKey) => {
              const isSelected = selectedArea === areaKey;
              const isComercial = areaKey === 'Comercial & Vendas';

              return (
                <button
                  key={areaKey}
                  onClick={() => {
                    setSelectedArea(areaKey);
                    if (onlyGestaoComercial && areaKey !== 'all') {
                      setOnlyGestaoComercial(false);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : isComercial
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-semibold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {isComercial && '🎯 '}
                  {areaKey === 'all' ? 'Todas as áreas' : areaKey}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
          <p className="text-xs sm:text-sm text-slate-600">
            {onlyGestaoComercial ? (
              <span>
                Filtro Gestão Comercial: <strong className="text-orange-700">{filteredJobs.length} vagas</strong> recomendadas
              </span>
            ) : (
              <span>
                Exibindo <span className="text-slate-900 font-bold">{filteredJobs.length}</span> vagas ativas
              </span>
            )}
          </p>
          {(searchQuery || selectedCity !== 'all' || selectedType !== 'all' || selectedArea !== 'all' || onlyWithSalary || includeExpired || onlyGestaoComercial) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedType('all');
                setSelectedArea('all');
                setOnlyWithSalary(false);
                setIncludeExpired(false);
                setOnlyGestaoComercial(false);
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-medium">Buscando e filtrando vagas de Teresina e Timon...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-4 sm:p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-800">
            <p className="font-semibold text-sm mb-1">Ops! Ocorreu um problema ao sincronizar as vagas.</p>
            <p className="text-xs text-rose-600 mb-3">{error}</p>
            <button
              onClick={() => loadJobs(true)}
              className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="py-12 sm:py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs px-4">
            <Briefcase className="w-10 sm:w-12 h-10 sm:h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Nenhuma vaga encontrada</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-4">
              Tente remover alguns filtros ou selecionar outra categoria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedType('all');
                setSelectedArea('all');
                setOnlyWithSalary(false);
                setOnlyGestaoComercial(false);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-xs"
            >
              Ver todas as vagas
            </button>
          </div>
        )}

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredJobs.map((job) => {
            const isEmail = job.application.channel === 'email';
            const isWhats = job.application.channel === 'whatsapp';
            const isLink = job.application.channel === 'link';
            const isEndingSoon = job.application.status === 'ultimos_dias';

            return (
              <div
                key={job.id}
                id={`vaga-${job.id}`}
                onClick={() => setActiveJob(job)}
                className={`group relative bg-white hover:bg-slate-50/80 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer ${
                  job.isExpired
                    ? 'border-slate-300 opacity-60'
                    : job.isGestaoComercial
                    ? 'border-orange-200 hover:border-orange-400 shadow-xs ring-1 ring-orange-500/10'
                    : isEndingSoon
                    ? 'border-amber-300 shadow-xs'
                    : 'border-slate-200 hover:border-emerald-500'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          job.city.includes('Timon')
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                        }`}
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        {job.city} – {job.state}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {job.jobType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {job.isGestaoComercial && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
                          <Award className="w-2.5 h-2.5" /> Gestão Comercial
                        </span>
                      )}
                      {isEndingSoon && !job.isExpired && !job.isGestaoComercial && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-2.5 h-2.5" /> Últimos dias
                        </span>
                      )}
                      {job.isToday && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Sparkles className="w-2.5 h-2.5" /> Hoje
                        </span>
                      )}
                      <button
                        onClick={(e) => handleToggleFavorite(job, e)}
                        title={
                          savedJobs[job.id]
                            ? `Salva como "${APPLICATION_STAGES.find((s) => s.id === savedJobs[job.id]?.stage)?.label}". Clique para desfavoritar.`
                            : 'Salvar vaga e acompanhar processo'
                        }
                        className={`p-1.5 rounded-lg border transition-all ${
                          savedJobs[job.id]
                            ? 'bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${savedJobs[job.id] ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Stage Badge if Saved */}
                  {savedJobs[job.id] && (() => {
                    const st = APPLICATION_STAGES.find((s) => s.id === savedJobs[job.id].stage);
                    if (!st) return null;
                    return (
                      <div className="mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${st.badgeBg} ${st.badgeBorder} ${st.badgeText}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                          <span>{st.icon} {st.label}</span>
                          {savedJobs[job.id].notes && (
                            <span className="text-[10px] opacity-75 font-normal ml-0.5">• Com anotação</span>
                          )}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Role Title */}
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-1.5 leading-snug">
                    {job.role}
                  </h2>

                  {/* Category Pill */}
                  <div className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="truncate">{job.area}</span>
                    {job.openings > 1 && (
                      <span className="text-slate-600 ml-auto font-semibold shrink-0">
                        {job.openings} vagas
                      </span>
                    )}
                  </div>

                  {/* Salary Box */}
                  <div className="mb-3.5">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold ${
                        job.hasSalaryInfo
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{job.salary}</span>
                    </div>
                  </div>

                  {/* Details (Schedule & Deadline) */}
                  <div className="space-y-1 mb-4 text-xs text-slate-600">
                    {job.application.deadline && (
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span className="truncate">
                          Inscrições até: <strong className="text-slate-900">{job.application.deadline}</strong>
                        </span>
                      </div>
                    )}
                    {job.schedule && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{job.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5">
                  {/* Primary Action Button */}
                  {isEmail && job.application.email && (
                    <a
                      href={`mailto:${job.application.email}?subject=${encodeURIComponent(
                        job.application.emailSubject || `Vaga - ${job.role}`
                      )}&body=${encodeURIComponent(
                        job.isGestaoComercial
                          ? generateGestaoCoverLetter(job)
                          : `Olá,\n\nSegue em anexo meu currículo para a oportunidade de ${job.role}.\n\nAtenciosamente.`
                      )}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-98 min-h-[38px]"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Enviar Currículo</span>
                    </a>
                  )}

                  {isWhats && job.application.whatsapp && (
                    <a
                      href={`https://wa.me/${job.application.whatsapp}?text=${encodeURIComponent(
                        job.application.whatsappMessage || `Olá, tenho interesse na vaga de ${job.role}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-xs active:scale-98 min-h-[38px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </a>
                  )}

                  {isLink && job.application.link && (
                    <a
                      href={job.application.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-xs active:scale-98 min-h-[38px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Inscrição</span>
                    </a>
                  )}

                  {/* Secondary Copy Button for Email */}
                  {isEmail && job.application.email && (
                    <button
                      onClick={(e) => handleCopyEmail(job, e)}
                      title="Copiar endereço de e-mail"
                      className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all border border-slate-200 min-h-[38px] min-w-[38px] flex items-center justify-center"
                    >
                      {copiedId === job.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Share button */}
                  <button
                    onClick={(e) => handleShare(job, e)}
                    title="Compartilhar vaga no WhatsApp"
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all border border-slate-200 min-h-[38px] min-w-[38px] flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
          </>
        )}

        {/* View Minhas Candidaturas / Favoritos */}
        {mainTab === 'favoritos' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Minhas Candidaturas */}
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-200/80 rounded-2xl p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 mb-2">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span>Acompanhamento de Processos Seletivos</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Minhas Candidaturas
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
                    Acompanhe em que etapa está cada vaga (currículo enviado, testes, entrevistas e respostas) e anote detalhes de cada processo.
                  </p>
                </div>

                {savedList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const summary =
                          `📋 Minhas Candidaturas em Teresina/Timon:\n\n` +
                          savedList
                            .map(
                              (s, i) =>
                                `${i + 1}. ${s.jobSnapshot.role} (${s.jobSnapshot.city})\n   • Status: ${
                                  APPLICATION_STAGES.find((st) => st.id === s.stage)?.label || s.stage
                                }${s.notes ? `\n   • Nota: ${s.notes}` : ''}`
                            )
                            .join('\n\n');
                        navigator.clipboard.writeText(summary);
                        alert('Resumo copiado com sucesso! Você pode colar no WhatsApp.');
                      }}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-600" />
                      <span>Copiar Resumo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Pipeline Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-amber-200/60">
                <div className="bg-white/90 rounded-xl p-2.5 sm:p-3 border border-amber-200/70 text-center shadow-xs">
                  <span className="block text-xl sm:text-2xl font-black text-slate-900">{savedStats.total}</span>
                  <span className="text-[11px] text-slate-500 font-medium">Total Salvas</span>
                </div>
                <div className="bg-white/90 rounded-xl p-2.5 sm:p-3 border border-blue-200 text-center shadow-xs">
                  <span className="block text-xl sm:text-2xl font-black text-blue-600">{savedStats.enviado}</span>
                  <span className="text-[11px] text-blue-700 font-medium">📨 Enviados</span>
                </div>
                <div className="bg-white/90 rounded-xl p-2.5 sm:p-3 border border-emerald-200 text-center shadow-xs">
                  <span className="block text-xl sm:text-2xl font-black text-emerald-600">
                    {savedStats.entrevista + savedStats.teste}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">🗣️ Entrevista / Teste</span>
                </div>
                <div className="bg-white/90 rounded-xl p-2.5 sm:p-3 border border-green-300 text-center shadow-xs">
                  <span className="block text-xl sm:text-2xl font-black text-green-700">{savedStats.aprovado}</span>
                  <span className="text-[11px] text-green-800 font-medium">🎉 Aprovadas!</span>
                </div>
              </div>
            </div>

            {/* Stage Filter Tabs & Search */}
            {savedList.length > 0 && (
              <div className="space-y-3">
                {/* Search in saved */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={savedSearchQuery}
                    onChange={(e) => setSavedSearchQuery(e.target.value)}
                    placeholder="Buscar em vagas salvas ou anotações..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none shadow-xs"
                  />
                  {savedSearchQuery && (
                    <button
                      onClick={() => setSavedSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Stage Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setSavedStageFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all ${
                      savedStageFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Todas ({savedStats.total})
                  </button>
                  {APPLICATION_STAGES.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSavedStageFilter(st.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                        savedStageFilter === st.id
                          ? `${st.badgeBg} ${st.badgeBorder} ${st.badgeText} border-2 font-bold shadow-xs`
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{st.icon}</span>
                      <span>{st.label}</span>
                      <span className="opacity-75">({savedStats[st.id] || 0})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State when no saved jobs */}
            {savedList.length === 0 && (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs px-4 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-500">
                  <Star className="w-8 h-8 fill-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Você ainda não favoritou nenhuma vaga
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
                  Ao navegar pelo feed de vagas, clique no ícone de estrela ⭐ no cartão da vaga. Assim você pode acompanhar todo o seu progresso (onde já enviou currículo, entrevistas agendadas, testes e retornos)!
                </p>
                <button
                  onClick={() => setMainTab('feed')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-all shadow-xs"
                >
                  Explorar Vagas Abertas
                </button>
              </div>
            )}

            {/* Empty State when filtered yields 0 */}
            {savedList.length > 0 && filteredSavedList.length === 0 && (
              <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs px-4">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Nenhuma vaga salva encontrada com esse filtro
                </h3>
                <button
                  onClick={() => {
                    setSavedStageFilter('all');
                    setSavedSearchQuery('');
                  }}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {/* Cards Grid for Saved Jobs */}
            {filteredSavedList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredSavedList.map((item) => {
                  const job = item.jobSnapshot;
                  const currentStage =
                    APPLICATION_STAGES.find((st) => st.id === item.stage) || APPLICATION_STAGES[0];
                  const isEmail = job.application.channel === 'email';
                  const isWhats = job.application.channel === 'whatsapp';

                  return (
                    <div
                      key={item.jobId}
                      className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-xs space-y-3.5"
                    >
                      <div>
                        {/* Top Row: Location, Type and Remove Button */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                job.city.includes('Timon')
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                              }`}
                            >
                              <MapPin className="w-3 h-3" />
                              {job.city} – {job.state}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                              {job.jobType}
                            </span>
                            {job.isGestaoComercial && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                <Award className="w-2.5 h-2.5" /> Gestão Comercial
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleRemoveFavorite(item.jobId, e)}
                            title="Remover vaga das salvas"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title */}
                        <h3
                          onClick={() => setActiveJob(job)}
                          className="font-bold text-base text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors leading-snug mb-1 line-clamp-2"
                        >
                          {job.role}
                        </h3>

                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                          <span className="truncate">{job.area}</span>
                          <span className="font-bold text-emerald-700 shrink-0">{job.salary}</span>
                        </div>

                        {/* Stage Selector Dropdown */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Etapa do Processo:
                          </label>
                          <select
                            value={item.stage}
                            onChange={(e) =>
                              handleUpdateTracking(
                                item.jobId,
                                { stage: e.target.value as ApplicationStage },
                                job
                              )
                            }
                            className={`w-full text-xs font-bold py-1.5 px-2 rounded-lg border outline-none transition-all cursor-pointer ${currentStage.badgeBg} ${currentStage.badgeBorder} ${currentStage.badgeText}`}
                          >
                            {APPLICATION_STAGES.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.icon} {st.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Notes Area */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
                            <span>Anotações / Próximos Passos:</span>
                            <span className="text-[9px] font-normal text-slate-400">Salva automático</span>
                          </label>
                          <textarea
                            rows={2}
                            value={item.notes || ''}
                            onChange={(e) =>
                              handleUpdateTracking(item.jobId, { notes: e.target.value }, job)
                            }
                            placeholder="Ex: Entrevista quinta 14h com Juliana do RH por chamada de vídeo..."
                            className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all resize-none"
                          />
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5">
                        {isEmail && job.application.email && (
                          <a
                            href={`mailto:${job.application.email}?subject=${encodeURIComponent(
                              job.application.emailSubject || `Vaga - ${job.role}`
                            )}&body=${encodeURIComponent(
                              job.isGestaoComercial
                                ? generateGestaoCoverLetter(job)
                                : `Olá,\n\nSegue em anexo meu currículo para a oportunidade de ${job.role}.\n\nAtenciosamente.`
                            )}`}
                            onClick={() => {
                              if (item.stage === 'salva') {
                                handleUpdateTracking(item.jobId, { stage: 'enviado' }, job);
                              }
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{item.stage === 'enviado' ? 'Reenviar E-mail' : 'Enviar Currículo'}</span>
                          </a>
                        )}

                        {isWhats && job.application.whatsapp && (
                          <a
                            href={`https://wa.me/${job.application.whatsapp}?text=${encodeURIComponent(
                              job.application.whatsappMessage || `Olá, tenho interesse na vaga de ${job.role}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (item.stage === 'salva') {
                                handleUpdateTracking(item.jobId, { stage: 'enviado' }, job);
                              }
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => setActiveJob(job)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {activeJob && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveJob(null)}
        >
          <div
            className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 sm:slide-in-from-bottom-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${
                      activeJob.city.includes('Timon')
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    {activeJob.city} – {activeJob.state}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700">
                    {activeJob.jobType}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600">
                    {activeJob.area}
                  </span>
                  {activeJob.isGestaoComercial && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-orange-100 text-orange-800 border border-orange-200">
                      <Award className="w-3 h-3" /> Perfil Gestão Comercial
                    </span>
                  )}
                  <span className="text-slate-400 text-[11px]">
                    {activeJob.publishedAtFormatted}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                  {activeJob.role}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleFavorite(activeJob)}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                    savedJobs[activeJob.id]
                      ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-amber-600'
                  }`}
                >
                  <Star className={`w-4 h-4 ${savedJobs[activeJob.id] ? 'fill-amber-400 text-amber-500' : ''}`} />
                  <span className="hidden sm:inline">
                    {savedJobs[activeJob.id] ? 'Favoritada' : 'Favoritar'}
                  </span>
                </button>
                <button
                  onClick={() => setActiveJob(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-sm">
              {/* Tracking & Notes Panel in Modal */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      Acompanhamento do Processo Seletivo
                    </span>
                  </div>
                  {savedJobs[activeJob.id] ? (
                    <button
                      onClick={() => handleRemoveFavorite(activeJob.id)}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remover dos favoritos
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Clique em uma etapa para salvar
                    </span>
                  )}
                </div>

                {/* Stage selector buttons */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                    Etapa da candidatura:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {APPLICATION_STAGES.map((st) => {
                      const isCurrent = savedJobs[activeJob.id]?.stage === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => handleUpdateTracking(activeJob.id, { stage: st.id }, activeJob)}
                          className={`p-2 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-1.5 ${
                            isCurrent
                              ? `${st.badgeBg} ${st.badgeBorder} ${st.badgeText} ring-2 ring-amber-400/40 font-bold shadow-xs`
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span>{st.icon}</span>
                          <span className="truncate">{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes textarea */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Anotações do processo (ex: entrevista agendada, contato da recrutadora, pretensão informada):
                  </label>
                  <textarea
                    rows={2}
                    value={savedJobs[activeJob.id]?.notes || ''}
                    onChange={(e) => handleUpdateTracking(activeJob.id, { notes: e.target.value }, activeJob)}
                    placeholder="Escreva aqui anotações pessoais sobre essa vaga..."
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Highlights Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Salário</span>
                  <span className="font-bold text-emerald-700 text-sm sm:text-base">
                    {activeJob.salary}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Vagas</span>
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {activeJob.openings} vaga(s)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Horário / Escala</span>
                  <span className="font-medium text-slate-800 text-xs sm:text-sm">
                    {activeJob.schedule || 'A combinar'}
                  </span>
                </div>
              </div>

              {/* Ready Cover Letter Card for Gestão Comercial */}
              {activeJob.isGestaoComercial && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <GraduationCap className="w-4 h-4 text-orange-600" />
                      Carta de Apresentação Pronta (Gestão Comercial)
                    </span>
                    <button
                      onClick={() => handleCopyCoverLetter(activeJob)}
                      className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs"
                    >
                      {copiedCoverLetter ? (
                        <>
                          <Check className="w-3 h-3" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copiar Texto
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white/70 p-3 rounded-xl border border-orange-200/60 whitespace-pre-line">
                    {generateGestaoCoverLetter(activeJob)}
                  </p>
                  <p className="text-[10px] text-orange-800/80 mt-1.5">
                    💡 Dica: Esse texto já vai preenchido automaticamente ao clicar em "Abrir E-mail"!
                  </p>
                </div>
              )}

              {/* Requirements */}
              {activeJob.requirements.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Requisitos Exigidos
                  </h4>
                  <ul className="space-y-1.5">
                    {activeJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Activities */}
              {activeJob.activities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Principais Atividades
                  </h4>
                  <ul className="space-y-1.5">
                    {activeJob.activities.map((ativ, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm">
                        <ChevronRight className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                        <span>{ativ}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {activeJob.benefits.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Benefícios Oferecidos
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {activeJob.benefits.map((ben, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium"
                      >
                        {ben}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Details */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
                  Como se Candidatar
                </h4>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-3">
                  {activeJob.application.rawInstructions || 'Envie seu currículo através dos canais abaixo.'}
                </p>

                {activeJob.application.deadline && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    Prazo limite: {activeJob.application.deadline}
                  </div>
                )}

                {activeJob.application.email && (
                  <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
                    <div className="truncate min-w-0">
                      <span className="text-slate-400 block text-[10px]">E-mail para envio:</span>
                      <span className="font-mono text-emerald-700 font-bold truncate block">
                        {activeJob.application.email}
                      </span>
                      {activeJob.application.emailSubject && (
                        <span className="text-slate-500 block text-[10px] mt-0.5 truncate">
                          Assunto: "{activeJob.application.emailSubject}"
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleCopyEmail(activeJob, e)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-slate-200"
                    >
                      {copiedId === activeJob.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Original Post Link */}
              <div className="text-center pt-1 pb-2">
                <a
                  href={activeJob.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                >
                  Ver post original no Themos Vagas <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
              {activeJob.application.channel === 'email' && activeJob.application.email && (
                <a
                  href={`mailto:${activeJob.application.email}?subject=${encodeURIComponent(
                    activeJob.application.emailSubject || `Vaga - ${activeJob.role}`
                  )}&body=${encodeURIComponent(
                    activeJob.isGestaoComercial
                      ? generateGestaoCoverLetter(activeJob)
                      : `Olá,\n\nSegue em anexo meu currículo para a vaga de ${activeJob.role}.\n\nAtenciosamente.`
                  )}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Enviar Currículo</span>
                </a>
              )}

              {activeJob.application.channel === 'whatsapp' && activeJob.application.whatsapp && (
                <a
                  href={`https://wa.me/${activeJob.application.whatsapp}?text=${encodeURIComponent(
                    activeJob.application.whatsappMessage || `Olá, tenho interesse na vaga de ${activeJob.role}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Chamar no WhatsApp</span>
                </a>
              )}

              {activeJob.application.channel === 'link' && activeJob.application.link && (
                <a
                  href={activeJob.application.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>Acessar Inscrição</span>
                </a>
              )}

              <button
                onClick={(e) => handleShare(activeJob, e)}
                className="p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition-all border border-slate-200 shrink-0"
                title="Compartilhar vaga"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 sm:mt-16 border-t border-slate-200 py-6 sm:py-8 text-center text-xs text-slate-500 bg-white px-4">
        <p className="mb-1 font-medium text-slate-600">
          Vagas THE & Timon • Automação e sincronização contínua de vagas de emprego e estágio
        </p>
        <p className="text-slate-400">
          Filtro ativo de vagas válidas para Teresina (PI) e Timon (MA) • Dados sincronizados em tempo real
        </p>
      </footer>
    </div>
  );
}
