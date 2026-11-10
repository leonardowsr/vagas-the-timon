'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
  Timer,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Job, JobsResponse } from '@/types/job';

export default function Home() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<'all' | 'Teresina' | 'Timon'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [onlyWithSalary, setOnlyWithSalary] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);

  // Modal & Toast
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
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error(err);
      if (!silent) setError(err.message || 'Erro ao carregar vagas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and reload when includeExpired changes
  useEffect(() => {
    loadJobs();
  }, [includeExpired]);

  // Background Auto-Sync every 60 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      loadJobs(true, true); // silent background refresh
    }, 60000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, includeExpired]);

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
        const searchable = `${job.title} ${job.role} ${job.area} ${job.salary} ${job.schedule} ${job.requirements.join(' ')} ${job.activities.join(' ')}`.toLowerCase();
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
    const text = `Olha essa vaga de *${job.role}* em *${job.city}*:\nSalário: ${job.salary}\nConfira e envie seu currículo: https://vagas-the-timon.vercel.app/#vaga-${job.id}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-xl tracking-tighter">
              THE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Vagas THE & Timon</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Oportunidades em Teresina (PI) e Timon (MA) • Apenas vagas válidas dentro do prazo
              </p>
            </div>
          </div>

          {/* Sync Status & Action */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Timer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sync automático a cada 60s {lastSyncTime && `(último: ${lastSyncTime})`}</span>
            </div>

            <button
              onClick={() => loadJobs(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              title="Sincronizar novas vagas agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Filtro inteligente: vagas vencidas são descartadas automaticamente
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Vagas de Emprego em{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Teresina & Timon
            </span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg mb-6">
            Informações diretas, sem propagandas. Salários em destaque e candidatura rápida por WhatsApp ou E-mail com o assunto exigido pela empresa.
          </p>

          {/* Metrics */}
          {data?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
                <span className="block text-2xl font-black text-emerald-600">{data.stats.total}</span>
                <span className="text-xs text-slate-500 font-medium">Vagas no Prazo</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
                <span className="block text-2xl font-black text-cyan-600">{data.stats.teresina}</span>
                <span className="text-xs text-slate-500 font-medium">📍 Teresina (PI)</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
                <span className="block text-2xl font-black text-amber-600">{data.stats.timon}</span>
                <span className="text-xs text-slate-500 font-medium">📍 Timon (MA)</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
                <span className="block text-2xl font-black text-indigo-600">{data.stats.estagios}</span>
                <span className="text-xs text-slate-500 font-medium">🎓 Estágios</span>
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cargo, área, habilidades, benefícios (ex: Vendas, TI, Estágio)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 placeholder-slate-400 text-sm sm:text-base outline-none transition-all shadow-sm"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* City Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs sm:text-sm">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'all'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({data?.stats.total ?? 0})
              </button>
              <button
                onClick={() => setSelectedCity('Teresina')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'Teresina'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📍 Teresina ({data?.stats.teresina ?? 0})
              </button>
              <button
                onClick={() => setSelectedCity('Timon')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'Timon'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📍 Timon ({data?.stats.timon ?? 0})
              </button>
            </div>

            {/* Checkbox Options */}
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyWithSalary}
                  onChange={(e) => setOnlyWithSalary(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600"
                />
                <span>Com salário informado 💰</span>
              </label>

              {data?.stats.expiradasFiltradas ? (
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-500 hover:text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={includeExpired}
                    onChange={(e) => setIncludeExpired(e.target.checked)}
                    className="rounded border-slate-300 text-slate-600 focus:ring-slate-400 w-4 h-4"
                  />
                  <span>Mostrar {data.stats.expiradasFiltradas} vagas expiradas</span>
                </label>
              ) : null}
            </div>
          </div>

          {/* Type Badges */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {['all', 'CLT', 'Estágio', 'Home Office', 'Jovem Aprendiz', 'Diarista'].map((typeKey) => (
              <button
                key={typeKey}
                onClick={() => setSelectedType(typeKey)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
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
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'all',
              'Vendas & Comercial',
              'Administrativo & Financeiro',
              'TI & Tecnologia',
              'Atendimento & Recepção',
              'Logística & Operacional',
              'Saúde & Cuidados',
              'Marketing & Criação',
            ].map((areaKey) => (
              <button
                key={areaKey}
                onClick={() => setSelectedArea(areaKey)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  selectedArea === areaKey
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {areaKey === 'all' ? 'Todas as áreas' : areaKey}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600">
            Exibindo <span className="text-slate-900 font-bold">{filteredJobs.length}</span> vagas ativas e dentro do prazo
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
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 text-sm font-medium">Buscando e filtrando vagas ativas de Teresina e Timon...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-800">
            <p className="font-semibold mb-2">Ops! Ocorreu um problema ao sincronizar as vagas.</p>
            <p className="text-xs text-rose-600 mb-4">{error}</p>
            <button
              onClick={() => loadJobs(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhuma vaga ativa encontrada</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
              Tente remover alguns filtros ou busque por termos mais genéricos.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedType('all');
                setSelectedArea('all');
                setOnlyWithSalary(false);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm"
            >
              Ver todas as vagas
            </button>
          </div>
        )}

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className={`group relative bg-white hover:bg-slate-50/80 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer ${
                  job.isExpired
                    ? 'border-slate-300 opacity-60'
                    : isEndingSoon
                    ? 'border-amber-300 shadow-xs'
                    : 'border-slate-200 hover:border-emerald-500'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                          job.city.includes('Timon')
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        {job.city} – {job.state}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {job.jobType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isEndingSoon && !job.isExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-2.5 h-2.5" /> Últimos dias
                        </span>
                      )}
                      {job.isToday && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Sparkles className="w-2.5 h-2.5" /> Hoje
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Title */}
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2 leading-snug">
                    {job.role}
                  </h2>

                  {/* Category Pill */}
                  <div className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {job.area}
                    {job.openings > 1 && (
                      <span className="text-slate-600 ml-auto font-semibold">
                        {job.openings} vagas
                      </span>
                    )}
                  </div>

                  {/* Salary Box */}
                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold ${
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
                  <div className="space-y-1.5 mb-5 text-xs text-slate-600">
                    {job.application.deadline && (
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span>Inscrições até: <strong className="text-slate-900">{job.application.deadline}</strong></span>
                      </div>
                    )}
                    {job.schedule && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{job.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                  {/* Primary Action Button */}
                  {isEmail && job.application.email && (
                    <a
                      href={`mailto:${job.application.email}?subject=${encodeURIComponent(
                        job.application.emailSubject || `Vaga - ${job.role}`
                      )}&body=${encodeURIComponent(
                        `Olá,\n\nSegue em anexo meu currículo para a oportunidade de ${job.role}.\n\nAtenciosamente.`
                      )}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-98"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Currículo</span>
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
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-xs active:scale-98"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chamar no WhatsApp</span>
                    </a>
                  )}

                  {isLink && job.application.link && (
                    <a
                      href={job.application.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white transition-all shadow-xs active:scale-98"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Acessar Inscrição</span>
                    </a>
                  )}

                  {/* Secondary Copy Button for Email */}
                  {isEmail && job.application.email && (
                    <button
                      onClick={(e) => handleCopyEmail(job, e)}
                      title="Copiar endereço de e-mail"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all border border-slate-200"
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
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all border border-slate-200"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Detail Modal */}
      {activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      activeJob.city.includes('Timon')
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    {activeJob.city} – {activeJob.state}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    {activeJob.jobType}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                    {activeJob.area}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">
                    {activeJob.publishedAtFormatted}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{activeJob.role}</h3>
              </div>

              <button
                onClick={() => setActiveJob(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Highlights Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Salário</span>
                  <span className="font-bold text-emerald-700 text-sm sm:text-base">
                    {activeJob.salary}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Vagas</span>
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {activeJob.openings} vaga(s)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-500 block mb-1">Horário / Escala</span>
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
                      <li key={i} className="flex items-start gap-2 text-slate-700">
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
                      <li key={i} className="flex items-start gap-2 text-slate-700">
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
                  <div className="flex flex-wrap gap-2">
                    {activeJob.benefits.map((ben, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium"
                      >
                        {ben}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  Como se Candidatar
                </h4>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-4">
                  {activeJob.application.rawInstructions || 'Envie seu currículo através dos canais abaixo.'}
                </p>

                {activeJob.application.deadline && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    Prazo limite: {activeJob.application.deadline}
                  </div>
                )}

                {activeJob.application.email && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
                    <div className="truncate">
                      <span className="text-slate-400 block text-[10px]">E-mail para envio:</span>
                      <span className="font-mono text-emerald-700 font-bold truncate">
                        {activeJob.application.email}
                      </span>
                      {activeJob.application.emailSubject && (
                        <span className="text-slate-500 block text-[10px] mt-0.5 truncate">
                          Assunto exigido: "{activeJob.application.emailSubject}"
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
              <div className="text-center pt-2">
                <a
                  href={activeJob.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                >
                  Ver publicação original no Themos Vagas <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              {activeJob.application.channel === 'email' && activeJob.application.email && (
                <a
                  href={`mailto:${activeJob.application.email}?subject=${encodeURIComponent(
                    activeJob.application.emailSubject || `Vaga - ${activeJob.role}`
                  )}&body=${encodeURIComponent(
                    `Olá,\n\nSegue em anexo meu currículo para a vaga de ${activeJob.role}.\n\nAtenciosamente.`
                  )}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Abrir E-mail e Enviar Currículo
                </a>
              )}

              {activeJob.application.channel === 'whatsapp' && activeJob.application.whatsapp && (
                <a
                  href={`https://wa.me/${activeJob.application.whatsapp}?text=${encodeURIComponent(
                    activeJob.application.whatsappMessage || `Olá, gostaria de me candidatar à vaga de ${activeJob.role}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar no WhatsApp
                </a>
              )}

              {activeJob.application.channel === 'link' && activeJob.application.link && (
                <a
                  href={activeJob.application.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Acessar Formulário da Empresa
                </a>
              )}

              <button
                onClick={(e) => handleShare(activeJob, e)}
                className="p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition-all border border-slate-200"
                title="Compartilhar vaga"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 py-8 text-center text-xs text-slate-500 bg-white">
        <p className="mb-2 font-medium text-slate-600">
          Vagas THE & Timon • Automação e sincronização contínua de vagas de emprego e estágio
        </p>
        <p className="text-slate-400">
          Filtro ativo de vagas válidas para Teresina (PI) e Timon (MA) • Dados sincronizados em tempo real
        </p>
      </footer>
    </div>
  );
}
