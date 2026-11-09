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
function inferArea(title: string, role: string, content: string): string {
  const text = `${title} ${role} ${content}`.toLowerCase();
  
  if (/programador|desenvolvedor|ti\b|tecnologia|inform[aá]tica|sistemas|software|redes|suporte t\.?i/i.test(text)) {
    return 'TI & Tecnologia';
  }
  if (/vendas|vendedor|comercial|consultor\(?a\)? de vendas|promotor|representante comercial|rca/i.test(text)) {
    return 'Vendas & Comercial';
  }
  if (/telemarketing|cobran[cç]a|atendente|atendimento|recepcionista|recep[cç][aã]o|balconista|gar[cç]om|caixa\b/i.test(text)) {
    return 'Atendimento & Recepção';
  }
  if (/financeir[oa]|cont[aá]bil|contabilidade|fiscal|faturamento|administrativ[oa]|administra[cç][aã]o|auxiliar adm|recursos humanos|\brh\b|dp\b|compras/i.test(text)) {
    return 'Administrativo & Financeiro';
  }
  if (/enferm|m[eé]dic|farm[aá]ci|sa[uú]de|veterin[aá]ri|fisioter|psic[oó]log|nutri/i.test(text)) {
    return 'Saúde & Cuidados';
  }
  if (/dep[oó]sito|estoque|log[ií]stic|motorista|entregador|repositor|produ[cç][aã]o|estiva|servente|auxiliar de servi[cç]os|operacional|limpeza/i.test(text)) {
    return 'Logística & Operacional';
  }
  if (/marketing|design|social media|comunica[cç][aã]o|publicidade/i.test(text)) {
    return 'Marketing & Criação';
  }
  if (/professor|est[aá]gio pedagog|educa[cç][aã]o|monitor/i.test(text)) {
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

  // Application Deadline (e.g., "até 11/11/2026")
  let deadline: string | undefined = undefined;
  const deadlineMatch = rawInstructions.match(/at[ée]\s*(?:o\s*dia\s*)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  if (deadlineMatch) {
    deadline = deadlineMatch[1];
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
  const dateObj = new Date(post.date);
  const now = new Date();
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
      rawInstructions: rawInstructions.slice(0, 400),
    },
    originalUrl: post.link,
    publishedAt: post.date,
    publishedAtFormatted,
    isToday,
  };
}
