import { Job, JobType, ApplicationChannel } from '@/types/job';

// Decode HTML entities
export function decodeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Strip HTML tags and clean whitespace
function stripTags(html: string): string {
  if (!html) return '';
  return decodeHtml(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract section text between <h5>SectionName</h5> and the next <h5> or <p>Themos Vagas
function getSection(name: string, html: string): string | null {
  const pattern = new RegExp(`<h5>${name}<\\/h5>\\s*([\\s\\S]*?)(?=<h5>|<p>Themos Vagas|$|<strong>Canal)`, 'i');
  const match = html.match(pattern);
  if (match && match[1]) {
    const text = stripTags(match[1]);
    return text.replace(/^[–\-•]\s*/, '').trim();
  }
  return null;
}

// Convert bullet text into array of clean strings
function parseListItems(text: string | null): string[] {
  if (!text) return [];
  // Split on ';' or line breaks or bullets '–', '-', '•'
  const items = text
    .split(/(?:;|\n|–|-|•)\s+/)
    .map((item) => item.replace(/^[–\-•;\.]\s*/, '').trim())
    .filter((item) => item.length > 2 && !item.toLowerCase().startsWith('themos vagas'));

  return Array.from(new Set(items));
}

// Infer Job Category
// Infer Job Category strictly by role and title first
function inferArea(title: string, role: string, content: string): string {
  const r = `${role} ${title}`.toLowerCase();
  const full = `${r} ${content}`.toLowerCase();

  // 1. TI & Tecnologia
  if (/\b(ti|t\.i|tecnologia|programador|desenvolvedor|inform[aá]tica|software|redes|sistemas|suporte t\.?i|dados|dev|fullstack|frontend|backend)\b/i.test(r)) {
    return 'TI & Tecnologia';
  }

  // 2. Recepção e Atendimento (deve vir antes para capturar "recepcionista comercial" em Atendimento)
  if (/\b(recepcionista|recep[cç][aã]o|atendente|atendimento|telemarketing|balconista|gar[cç]om|caixa|operador\(?a\)? de caixa|cobran[cç]a)\b/i.test(r)) {
    return 'Atendimento & Recepção';
  }

  // 3. Supermercado, Varejo e Prevenção de Perdas (separado de Comercial)
  if (/\b(supermercado|preven[cç][aã]o de perdas|fiscal de loja|fiscal de preven[cç][aã]o|repositor|empacotador|a[cç]ougue|padeiro|hortifruti|frente de loja|conferente de loja)\b/i.test(r)) {
    return 'Varejo & Supermercado';
  }

  // 4. Comercial & Vendas (Foco estrito em vagas comerciais: Vendedor, Assistente/Analista Comercial, SDR, Consultor de Vendas)
  if (
    /\b(comercial|vendas?|vendedor|vendedora|consultor\(?a\)? de vendas|consultor\(?a\)? comercial|assistente comercial|analista comercial|executiv[oa] de contas|prospec[cç][aã]o|inside sales|sdr|bdr|representante comercial|rca|televendas|promotor\(?a\)? de vendas|supervisor\(?a\)? comercial|gerente comercial|coordenador\(?a\)? comercial)\b/i.test(r)
  ) {
    return 'Comercial & Vendas';
  }

  // 5. Saúde & Cuidados
  if (/\b(enferm|m[eé]dic|farm[aá]c|sa[uú]de|veterin[aá]r|fisioter|psic[oó]l|nutri|dentista|odont|hospital|cl[ií]nica)\b/i.test(r)) {
    return 'Saúde & Cuidados';
  }

  // 6. Administrativo & Financeiro
  if (/\b(financeir|cont[aá]bil|contabilidade|fiscal|faturamento|administrativ|administra[cç]|auxiliar adm|recursos humanos|\brh\b|\bdp\b|compras|sinistro|processos|controladoria)\b/i.test(r)) {
    return 'Administrativo & Financeiro';
  }

  // 7. Logística & Operacional
  if (/\b(dep[oó]sito|estoque|log[ií]stic|motorista|entregador|produ[cç][aã]o|estiva|servente|servi[cç]os gerais|limpeza|zelador|turma|operacional|manuten[cç][aã]o|auxiliar operacional)\b/i.test(r)) {
    return 'Logística & Operacional';
  }

  // 8. Marketing & Criação
  if (/\b(marketing|design|social media|comunica[cç][aã]o|publicidade|audiovisual|copywriter)\b/i.test(r)) {
    return 'Marketing & Criação';
  }

  // 9. Educação
  if (/\b(professor|pedagog|educa[cç][aã]o|monitor|letras|escola)\b/i.test(r)) {
    return 'Educação';
  }

  return 'Geral';
}

// Infer Job Type
function inferJobType(title: string, content: string): JobType {
  const text = `${title} ${content}`.toLowerCase();
  if (text.includes('estágio') || text.includes('estagio')) return 'Estágio';
  if (text.includes('jovem aprendiz')) return 'Jovem Aprendiz';
  if (text.includes('home office') || text.includes('remoto')) return 'Home Office';
  if (text.includes('diarista')) return 'Diarista';
  if (text.includes('pcd')) return 'PCD';
  if (text.includes('trainee')) return 'Trainee';
  return 'CLT';
}

// Parse WordPress Post into Job
export function parseWordPressPost(post: any): Job | null {
  const rawTitle = decodeHtml(post.title?.rendered || '');
  const contentHtml = post.content?.rendered || '';

  // Extract Title, City, State, Openings
  // Pattern: "Consultor(a) de Vendas | Teresina – PI | 04 vaga(s)"
  const titleMatch = rawTitle.match(/^(.*?)\s*\|\s*(.*?)\s*[–-]\s*([A-Za-z]{2})\s*(?:\|\s*(\d+)?\s*vaga)?/i);

  let role = rawTitle;
  let cityRaw = '';
  let stateRaw = 'PI';
  let openings = 1;

  if (titleMatch) {
    role = titleMatch[1].trim();
    cityRaw = titleMatch[2].trim();
    stateRaw = titleMatch[3].toUpperCase().trim();
    if (titleMatch[4]) {
      openings = parseInt(titleMatch[4], 10) || 1;
    }
  } else {
    // Fallback: check text for Teresina or Timon
    if (/teresina/i.test(rawTitle) || /teresina/i.test(contentHtml)) {
      cityRaw = 'Teresina';
      stateRaw = 'PI';
    } else if (/timon/i.test(rawTitle) || /timon/i.test(contentHtml)) {
      cityRaw = 'Timon';
      stateRaw = 'MA';
    }
  }

  const isTeresina = /teresina|\bthe\b/i.test(cityRaw) || /teresina/i.test(rawTitle);
  const isTimon = /timon/i.test(cityRaw) || /timon/i.test(rawTitle);

  // STRICT FILTER: If neither Teresina nor Timon, discard post!
  if (!isTeresina && !isTimon) {
    return null;
  }

  const city: 'Teresina' | 'Timon' | 'Teresina / Timon' = 
    isTeresina && isTimon ? 'Teresina / Timon' : isTimon ? 'Timon' : 'Teresina';
  const state: 'PI' | 'MA' = isTimon && !isTeresina ? 'MA' : 'PI';

  // Sections
  const rawSalary = getSection('Salário', contentHtml) || 'A combinar';
  const cleanSalary = rawSalary.replace(/^[–\-•]\s*/, '').trim();
  const hasSalaryInfo = !cleanSalary.toLowerCase().includes('combinar') && cleanSalary.length > 2;

  const rawReq = getSection('Requisitos', contentHtml);
  const requirements = parseListItems(rawReq);

  const rawAtiv = getSection('Atividades', contentHtml);
  const activities = parseListItems(rawAtiv);

  const rawBen = getSection('Benefícios', contentHtml);
  const benefits = parseListItems(rawBen);

  const rawHorario = getSection('Horários', contentHtml) || getSection('Horário', contentHtml) || '';
  const schedule = rawHorario.replace(/^[–\-•]\s*/, '').trim();

  const totalVagasSection = getSection('Total de vagas', contentHtml);
  if (totalVagasSection) {
    const qtdMatch = totalVagasSection.match(/(\d+)/);
    if (qtdMatch) {
      openings = parseInt(qtdMatch[1], 10);
    }
  }

  // Parse Application section (Currículos)
  const curriculoMatch = contentHtml.match(/<h5>Currículos<\/h5>\s*([\s\S]*?)(?=<h5>|<p>Themos Vagas|$|<strong>Canal)/i);
  const curriculoHtml = curriculoMatch ? curriculoMatch[1] : '';
  const rawInstructions = stripTags(curriculoHtml);

  // Email extraction
  const mailtoMatch = curriculoHtml.match(/mailto:([^\s"'>\?]+)/i);
  const generalEmailMatch = curriculoHtml.match(/[\w\.\-+]+@[\w\.\-]+\.\w+/i);
  const email = mailtoMatch ? mailtoMatch[1] : (generalEmailMatch ? generalEmailMatch[0] : undefined);

  // Email Subject required by employer
  let emailSubject = `Currículo - ${role}`;
  const subjectMatch = rawInstructions.match(/assunto\s*[“"']([^”"']+)["”']/i) ||
                       rawInstructions.match(/título\/assunto\s*[“"']([^”"']+)["”']/i);
  if (subjectMatch) {
    emailSubject = subjectMatch[1].trim();
  }

  // WhatsApp extraction
  let whatsapp: string | undefined = undefined;
  const waLinkMatch = curriculoHtml.match(/wa\.me\/(\d+)/i);
  if (waLinkMatch) {
    whatsapp = waLinkMatch[1];
  } else {
    const phoneMatch = rawInstructions.match(/(?:whats|whatsapp|fone|telefone|celular).*?(\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4})/i);
    if (phoneMatch) {
      const digits = phoneMatch[1].replace(/\D/g, '');
      if (digits.length === 10 || digits.length === 11) {
        whatsapp = `55${digits}`;
      }
    }
  }

  // External Links (Forms, ATS platforms)
  let externalLink: string | undefined = undefined;
  const linkRegex = /href=["'](https?:\/\/[^"'\s]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(curriculoHtml)) !== null) {
    const url = match[1];
    if (
      !url.includes('wa.me') &&
      !url.includes('whatsapp.com') &&
      !url.includes('themosvagas') &&
      !url.includes('instagram.com') &&
      !url.includes('facebook.com') &&
      !url.includes('t.me') &&
      !url.startsWith('mailto:')
    ) {
      externalLink = url;
      break;
    }
  }

  // Application Deadline & Expiration logic
  let deadline: string | undefined = undefined;
  let deadlineDateIso: string | undefined = undefined;
  let isExpired = false;
  let daysRemaining: number | null = null;
  let jobStatus: 'aberta' | 'ultimos_dias' | 'expirada' = 'aberta';

  const dateObj = new Date(post.date);
  const now = new Date();

  const deadlineMatch = rawInstructions.match(/at[ée]\s*(?:o\s*dia\s*)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  if (deadlineMatch) {
    deadline = deadlineMatch[1];
    const parts = deadline.split('/');
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      let year = dateObj.getFullYear();
      if (parts.length === 3) {
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        year = y;
      }
      const deadlineObj = new Date(year, month, day, 23, 59, 59, 999);
      deadlineDateIso = deadlineObj.toISOString();

      // Check if deadline is before today
      if (deadlineObj.getTime() < now.getTime()) {
        isExpired = true;
        jobStatus = 'expirada';
      } else {
        const msPerDay = 1000 * 60 * 60 * 24;
        daysRemaining = Math.max(0, Math.ceil((deadlineObj.getTime() - now.getTime()) / msPerDay));
        if (daysRemaining <= 2) {
          jobStatus = 'ultimos_dias';
        }
      }
    }
  } else {
    // If no explicit deadline, expired if published more than 25 days ago
    const ageDays = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 25) {
      isExpired = true;
      jobStatus = 'expirada';
    }
  }

  // Decide channel priority
  let channel: ApplicationChannel = 'link';
  if (email) {
    channel = 'email';
  } else if (whatsapp) {
    channel = 'whatsapp';
  } else if (externalLink) {
    channel = 'link';
  }

  const whatsappMessage = `Olá! Vi a oportunidade para ${role} em ${city} e gostaria de enviar meu currículo e informações.`;

  // Published Date formatting
  const isToday = dateObj.toDateString() === now.toDateString();
  const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  const publishedAtFormatted = isToday ? `Hoje às ${timeFormatted}` : `${dateFormatted} às ${timeFormatted}`;

  const jobType = inferJobType(rawTitle, contentHtml);
  const area = inferArea(rawTitle, role, contentHtml);

  return {
    id: post.id,
    slug: post.slug,
    title: rawTitle,
    role,
    city,
    state,
    openings,
    jobType,
    area,
    salary: cleanSalary,
    hasSalaryInfo,
    benefits,
    requirements,
    activities,
    schedule,
    application: {
      channel,
      email,
      emailSubject,
      whatsapp,
      whatsappMessage,
      link: externalLink,
      deadline,
      deadlineDate: deadlineDateIso,
      isExpired,
      daysRemaining,
      status: jobStatus,
      rawInstructions: rawInstructions.slice(0, 400),
    },
    originalUrl: post.link,
    publishedAt: post.date,
    publishedAtFormatted,
    isToday,
    isExpired,
  };
}
