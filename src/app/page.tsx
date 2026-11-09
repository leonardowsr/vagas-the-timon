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
  Users,
  Sparkles,
  Calendar,
  ChevronRight,
  X,
  Share2,
  Filter,
  GraduationCap,
  Building,
} from 'lucide-react';
import { Job, JobsResponse } from '@/types/job';

export default function Home() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<'all' | 'Teresina' | 'Timon'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [onlyWithSalary, setOnlyWithSalary] = useState(false);

  // Modal & Toast
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [shareToast, setShareToast] = useState(false);

  // Fetch jobs from internal API
  const loadJobs = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const url = force ? '/api/vagas?refresh=1' : '/api/vagas';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Não foi possível carregar as vagas.');

      const json: JobsResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar vagas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return [];

    return data.jobs.filter((job) => {
      // City
      if (selectedCity === 'Teresina' && !job.city.includes('Teresina')) return false;
      if (selectedCity === 'Timon' && !job.city.includes('Timon')) return false;

      // Type
      if (selectedType !== 'all' && job.jobType !== selectedType) return false;

      // Area
      if (selectedArea !== 'all' && job.area !== selectedArea) return false;

      // Salary
      if (onlyWithSalary && !job.hasSalaryInfo) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchable = `${job.title} ${job.role} ${job.area} ${job.salary} ${job.schedule} ${job.requirements.join(' ')} ${job.activities.join(' ')}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [data, selectedCity, selectedType, selectedArea, onlyWithSalary, searchQuery]);

  // Copy email to clipboard
  const handleCopyEmail = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.application.email) return;

    navigator.clipboard.writeText(job.application.email);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Share job via WhatsApp or link
  const handleShare = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Olha essa vaga de *${job.role}* em *${job.city}*:\nSalário: ${job.salary}\nConfira os detalhes e candidate-se: ${window.location.origin}/#vaga-${job.id}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl tracking-tighter">
              THE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Vagas THE & Timon</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Oportunidades filtradas de Teresina (PI) e Timon (MA) direto ao ponto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadJobs(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
              title="Buscar novas vagas agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Atualizar vagas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Empregos e Estágios em{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Teresina & Timon
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mb-6">
            Sem anúncios chatos, sem enrolação. Todas as vagas com informações organizadas e botão de candidatura em 1 clique por E-mail ou WhatsApp.
          </p>

          {/* Quick Metrics Bar */}
          {data?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="block text-2xl font-black text-emerald-400">{data.stats.total}</span>
                <span className="text-xs text-slate-400 font-medium">Vagas Ativas</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="block text-2xl font-black text-cyan-400">{data.stats.teresina}</span>
                <span className="text-xs text-slate-400 font-medium">📍 Teresina (PI)</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="block text-2xl font-black text-amber-400">{data.stats.timon}</span>
                <span className="text-xs text-slate-400 font-medium">📍 Timon (MA)</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="block text-2xl font-black text-purple-400">{data.stats.estagios}</span>
                <span className="text-xs text-slate-400 font-medium">🎓 Estágios</span>
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
              placeholder="Buscar por cargo, área, habilidades, benefícios (ex: TI, Vendas, Estágio)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-sm sm:text-base outline-none transition-all shadow-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-8 backdrop-blur-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* City Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs sm:text-sm">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({data?.stats.total ?? 0})
              </button>
              <button
                onClick={() => setSelectedCity('Teresina')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'Teresina'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📍 Teresina ({data?.stats.teresina ?? 0})
              </button>
              <button
                onClick={() => setSelectedCity('Timon')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCity === 'Timon'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📍 Timon ({data?.stats.timon ?? 0})
              </button>
            </div>

            {/* Toggle Salary */}
            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-300 select-none">
              <input
                type="checkbox"
                checked={onlyWithSalary}
                onChange={(e) => setOnlyWithSalary(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20 w-4 h-4 accent-emerald-500"
              />
              <span>Apenas com salário informado 💰</span>
            </label>
          </div>

          {/* Type Badges */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
            {['all', 'CLT', 'Estágio', 'Home Office', 'Jovem Aprendiz', 'Diarista'].map((typeKey) => (
              <button
                key={typeKey}
                onClick={() => setSelectedType(typeKey)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedType === typeKey
                    ? 'bg-slate-100 text-slate-950 font-semibold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
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
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {areaKey === 'all' ? 'Todas as áreas' : areaKey}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            Exibindo <span className="text-white font-semibold">{filteredJobs.length}</span> vagas encontradas
          </p>
          {(searchQuery || selectedCity !== 'all' || selectedType !== 'all' || selectedArea !== 'all' || onlyWithSalary) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedType('all');
                setSelectedArea('all');
                setOnlyWithSalary(false);
              }}
              className="text-xs text-emerald-400 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">Buscando e processando vagas em Teresina e Timon...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-300">
            <p className="font-semibold mb-2">Ops! Ocorreu um problema ao carregar as vagas.</p>
            <p className="text-xs text-rose-400 mb-4">{error}</p>
            <button
              onClick={() => loadJobs(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-all"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhuma vaga encontrada</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
              Tente remover alguns filtros ou buscar por palavras-chave mais genéricas.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedType('all');
                setSelectedArea('all');
                setOnlyWithSalary(false);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all"
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

            return (
              <div
                key={job.id}
                id={`vaga-${job.id}`}
                onClick={() => setActiveJob(job)}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/20 cursor-pointer"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                          job.city.includes('Timon')
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        {job.city} – {job.state}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {job.jobType}
                      </span>
                    </div>

                    {job.isToday && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <Sparkles className="w-2.5 h-2.5" /> Hoje
                      </span>
                    )}
                  </div>

                  {/* Role Title */}
                  <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 leading-snug">
                    {job.role}
                  </h2>

                  {/* Category Pill */}
                  <div className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
                    {job.area}
                    {job.openings > 1 && (
                      <span className="text-slate-400 ml-auto font-semibold">
                        {job.openings} vagas
                      </span>
                    )}
                  </div>

                  {/* Salary Highlight */}
                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold ${
                        job.hasSalaryInfo
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800/60 text-slate-400 border border-slate-700/40'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{job.salary}</span>
                    </div>
                  </div>

                  {/* Highlights (Schedule, Key Requirement) */}
                  <div className="space-y-1.5 mb-5 text-xs text-slate-300">
                    {job.schedule && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span className="truncate">{job.schedule}</span>
                      </div>
                    )}
                    {job.requirements.length > 0 && (
                      <p className="text-slate-400 line-clamp-2 text-xs leading-relaxed">
                        <span className="text-slate-500 font-medium">Requisitos: </span>
                        {job.requirements.slice(0, 2).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  {/* Primary Action Button */}
                  {isEmail && job.application.email && (
                    <a
                      href={`mailto:${job.application.email}?subject=${encodeURIComponent(
                        job.application.emailSubject || `Vaga - ${job.role}`
                      )}&body=${encodeURIComponent(
                        `Olá,\n\nSegue em anexo meu currículo para a vaga de ${job.role}.\n\nAtenciosamente.`
                      )}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/10 active:scale-98"
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
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-400 text-slate-950 transition-all shadow-md shadow-green-500/10 active:scale-98"
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
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/10 active:scale-98"
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
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                    >
                      {copiedId === job.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Share button */}
                  <button
                    onClick={(e) => handleShare(job, e)}
                    title="Compartilhar vaga no WhatsApp"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      activeJob.city.includes('Timon')
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    {activeJob.city} – {activeJob.state}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300">
                    {activeJob.jobType}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400">
                    {activeJob.area}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">
                    {activeJob.publishedAtFormatted}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{activeJob.role}</h3>
              </div>

              <button
                onClick={() => setActiveJob(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Highlights Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-500 block mb-1">Salário</span>
                  <span className="font-bold text-emerald-400 text-sm sm:text-base">
                    {activeJob.salary}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-500 block mb-1">Vagas</span>
                  <span className="font-bold text-white text-sm sm:text-base">
                    {activeJob.openings} vaga(s)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-500 block mb-1">Horário / Escala</span>
                  <span className="font-medium text-slate-300 text-xs sm:text-sm">
                    {activeJob.schedule || 'A combinar'}
                  </span>
                </div>
              </div>

              {/* Requirements */}
              {activeJob.requirements.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Requisitos Exigidos
                  </h4>
                  <ul className="space-y-1.5">
                    {activeJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Activities */}
              {activeJob.activities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Principais Atividades
                  </h4>
                  <ul className="space-y-1.5">
                    {activeJob.activities.map((ativ, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{ativ}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {activeJob.benefits.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Benefícios Oferecidos
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeJob.benefits.map((ben, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                      >
                        {ben}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Como se Candidatar
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                  {activeJob.application.rawInstructions || 'Envie seu currículo através das opções abaixo.'}
                </p>

                {activeJob.application.deadline && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    Prazo limite: {activeJob.application.deadline}
                  </div>
                )}

                {activeJob.application.email && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="truncate">
                      <span className="text-slate-500 block text-[10px]">E-mail para envio:</span>
                      <span className="font-mono text-emerald-300 font-semibold truncate">
                        {activeJob.application.email}
                      </span>
                      {activeJob.application.emailSubject && (
                        <span className="text-slate-400 block text-[10px] mt-0.5 truncate">
                          Assunto: "{activeJob.application.emailSubject}"
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleCopyEmail(activeJob, e)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {copiedId === activeJob.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
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
                  className="text-xs text-slate-500 hover:text-slate-400 inline-flex items-center gap-1"
                >
                  Ver publicação original no Themos Vagas <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
              {activeJob.application.channel === 'email' && activeJob.application.email && (
                <a
                  href={`mailto:${activeJob.application.email}?subject=${encodeURIComponent(
                    activeJob.application.emailSubject || `Vaga - ${activeJob.role}`
                  )}&body=${encodeURIComponent(
                    `Olá,\n\nSegue em anexo meu currículo para a vaga de ${activeJob.role}.\n\nAtenciosamente.`
                  )}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
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
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-green-500/20"
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
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Acessar Formulário da Empresa
                </a>
              )}

              <button
                onClick={(e) => handleShare(activeJob, e)}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                title="Compartilhar vaga"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p className="mb-2">
          Vagas THE & Timon • Automação e agregador inteligente de vagas de emprego e estágio
        </p>
        <p className="text-slate-600">
          Dados sincronizados em tempo real de Themos Vagas • Exclusivo para Teresina (PI) e Timon (MA)
        </p>
      </footer>
    </div>
  );
}
