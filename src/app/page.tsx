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
} from 'lucide-react';
import { Job, JobsResponse } from '@/types/job';

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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<'all' | 'Teresina' | 'Timon'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [onlyWithSalary, setOnlyWithSalary] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);

  // Modal state
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeJob]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return [];

    return data.jobs.filter((job) => {
      // Expiration check
      if (!includeExpired && job.isExpired) return false;

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
  }, [data, selectedCity, selectedType, selectedArea, onlyWithSalary, searchQuery, includeExpired]);

  // Copy email to clipboard
  const handleCopyEmail = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.application.email) return;

    navigator.clipboard.writeText(job.application.email);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2500);
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
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

          {/* Area Badges (Strict: Comercial & Vendas separada!) */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar pb-1">
            {AREAS.map((areaKey) => {
              const isSelected = selectedArea === areaKey;
              const isComercial = areaKey === 'Comercial & Vendas';

              return (
                <button
                  key={areaKey}
                  onClick={() => setSelectedArea(areaKey)}
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
            Exibindo <span className="text-slate-900 font-bold">{filteredJobs.length}</span> vagas ativas
          </p>
          {(searchQuery || selectedCity !== 'all' || selectedType !== 'all' || selectedArea !== 'all' || onlyWithSalary || includeExpired) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedType('all');
                setSelectedArea('all');
                setOnlyWithSalary(false);
                setIncludeExpired(false);
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
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-xs"
            >
              Ver todas as vagas
            </button>
          </div>
        )}

        {/* Jobs Grid (Responsive: 1 col on mobile, 2 on tablet, 3 on desktop) */}
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
                      {isEndingSoon && !job.isExpired && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-2.5 h-2.5" /> Últimos dias
                        </span>
                      )}
                      {job.isToday && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Sparkles className="w-2.5 h-2.5" /> Hoje
                        </span>
                      )}
                    </div>
                  </div>

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

                {/* Bottom Action Strip (Responsive for Mobile touch) */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5">
                  {/* Primary Action Button */}
                  {isEmail && job.application.email && (
                    <a
                      href={`mailto:${job.application.email}?subject=${encodeURIComponent(
                        job.application.emailSubject || `Vaga - ${job.role}`
                      )}&body=${encodeURIComponent(
                        `Olá,\n\nSegue em anexo meu currículo para a oportunidade de ${job.role}.\n\nAtenciosamente.`
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
      </main>

      {/* Detail Modal (100% Mobile Friendly: Bottom sheet style on small screens) */}
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
                  <span className="text-slate-400 text-[11px]">
                    {activeJob.publishedAtFormatted}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                  {activeJob.role}
                </h3>
              </div>

              <button
                onClick={() => setActiveJob(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-sm">
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

            {/* Modal Bottom Actions (Fixed at bottom on Mobile) */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
              {activeJob.application.channel === 'email' && activeJob.application.email && (
                <a
                  href={`mailto:${activeJob.application.email}?subject=${encodeURIComponent(
                    activeJob.application.emailSubject || `Vaga - ${activeJob.role}`
                  )}&body=${encodeURIComponent(
                    `Olá,\n\nSegue em anexo meu currículo para a vaga de ${activeJob.role}.\n\nAtenciosamente.`
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
                    activeJob.application.whatsappMessage || `Olá, gostaria de me candidatar à vaga de ${activeJob.role}.`
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
