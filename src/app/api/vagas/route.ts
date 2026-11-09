import { NextRequest, NextResponse } from 'next/server';
import { parseWordPressPost } from '@/lib/themos-parser';
import { Job, JobsResponse } from '@/types/job';

// Cache memory in-process for fallback
let cachedResponse: { timestamp: number; data: JobsResponse } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

async function fetchPage(page: number): Promise<any[]> {
  try {
    const res = await fetch(
      `https://themosvagas.com.br/wp-json/wp/v2/posts?per_page=50&page=${page}&_fields=id,date,slug,link,title,content`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (VagasTHE/1.0; Automacao Teresina-Timon)',
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error(`Error fetching page ${page}:`, err);
    return [];
  }
}

async function getAllActiveJobs(forceRefresh = false): Promise<JobsResponse> {
  const now = Date.now();
  if (!forceRefresh && cachedResponse && now - cachedResponse.timestamp < CACHE_TTL_MS) {
    return cachedResponse.data;
  }

  // Fetch first 2 pages (up to 200 latest posts from Themos Vagas)
  const [page1, page2] = await Promise.all([
    fetchPage(1),
    fetchPage(2),
  ]);

  const rawPosts = [...(Array.isArray(page1) ? page1 : []), ...(Array.isArray(page2) ? page2 : [])];

  const jobs: Job[] = [];
  for (const post of rawPosts) {
    const parsed = parseWordPressPost(post);
    if (parsed) {
      jobs.push(parsed);
    }
  }

  // Calculate statistics
  const stats = {
    total: jobs.length,
    teresina: jobs.filter((j) => j.city.includes('Teresina')).length,
    timon: jobs.filter((j) => j.city.includes('Timon')).length,
    estagios: jobs.filter((j) => j.jobType === 'Estágio').length,
    clt: jobs.filter((j) => j.jobType === 'CLT').length,
    homeOffice: jobs.filter((j) => j.jobType === 'Home Office').length,
    jovemAprendiz: jobs.filter((j) => j.jobType === 'Jovem Aprendiz').length,
  };

  const responseData: JobsResponse = {
    jobs,
    total: jobs.length,
    stats,
    lastUpdated: new Date().toISOString(),
  };

  cachedResponse = {
    timestamp: now,
    data: responseData,
  };

  return responseData;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('refresh') === '1' || searchParams.get('refresh') === 'true';
    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const city = searchParams.get('city') || '';
    const type = searchParams.get('type') || '';
    const area = searchParams.get('area') || '';
    const hasSalary = searchParams.get('hasSalary') === 'true';

    const fullData = await getAllActiveJobs(forceRefresh);

    let filteredJobs = fullData.jobs;

    if (city && city !== 'all') {
      filteredJobs = filteredJobs.filter((job) => job.city.toLowerCase().includes(city.toLowerCase()));
    }

    if (type && type !== 'all') {
      filteredJobs = filteredJobs.filter((job) => job.jobType.toLowerCase() === type.toLowerCase());
    }

    if (area && area !== 'all') {
      filteredJobs = filteredJobs.filter((job) => job.area.toLowerCase() === area.toLowerCase());
    }

    if (hasSalary) {
      filteredJobs = filteredJobs.filter((job) => job.hasSalaryInfo);
    }

    if (q) {
      filteredJobs = filteredJobs.filter((job) => {
        const searchable = `${job.title} ${job.role} ${job.area} ${job.salary} ${job.schedule} ${job.requirements.join(' ')} ${job.activities.join(' ')}`.toLowerCase();
        return searchable.includes(q);
      });
    }

    return NextResponse.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
      stats: fullData.stats,
      lastUpdated: fullData.lastUpdated,
    });
  } catch (error) {
    console.error('Error in /api/vagas:', error);
    return NextResponse.json(
      { error: 'Falha ao carregar vagas do Themos Vagas.' },
      { status: 500 }
    );
  }
}
