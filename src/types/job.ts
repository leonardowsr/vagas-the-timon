export type JobType = 'CLT' | 'Estágio' | 'Home Office' | 'Jovem Aprendiz' | 'Diarista' | 'PCD' | 'Trainee' | 'Geral';

export type ApplicationChannel = 'email' | 'whatsapp' | 'link';

export interface ApplicationInfo {
  channel: ApplicationChannel;
  email?: string;
  emailSubject?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  link?: string;
  deadline?: string;
  deadlineDate?: string;
  isExpired: boolean;
  daysRemaining: number | null;
  status: 'aberta' | 'ultimos_dias' | 'expirada';
  rawInstructions: string;
}

export interface Job {
  id: number;
  slug: string;
  title: string;
  role: string;
  city: 'Teresina' | 'Timon' | 'Teresina / Timon';
  state: 'PI' | 'MA';
  openings: number;
  jobType: JobType;
  area: string;
  salary: string;
  hasSalaryInfo: boolean;
  benefits: string[];
  requirements: string[];
  activities: string[];
  schedule: string;
  application: ApplicationInfo;
  originalUrl: string;
  publishedAt: string;
  publishedAtFormatted: string;
  isToday: boolean;
  isExpired: boolean;
  isGestaoComercial: boolean; // Flag para destacar perfil formado em Gestão Comercial
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  stats: {
    total: number;
    teresina: number;
    timon: number;
    estagios: number;
    clt: number;
    homeOffice: number;
    jovemAprendiz: number;
    gestaoComercial: number;
    expiradasFiltradas: number;
  };
  lastUpdated: string;
}
