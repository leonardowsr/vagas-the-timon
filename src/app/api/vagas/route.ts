import { NextRequest, NextResponse } from 'next/server';
import { parseWordPressPost } from '@/lib/themos-parser';
import { Job, JobsResponse } from '@/types/job';

// Cache memory in-process for fallback
let cachedResponse: { timestamp: number; data: JobsResponse } | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

async function fetchPage(page: number, afterIso: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://themosvagas.com.br/wp-json/wp/v2/posts?per_page=100&page=${page}&after=${afterIso}&_fields=id,date,slug,link,title,content`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (VagasTHE/2.0; Automacao Teresina-Timon)',
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

  // Calculate 10 days ago ISO date string
  const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);
  const afterIso = `${tenDaysAgo.toISOString().split('T')[0]}T00:00:00`;

  // Fetch up to 8 pages (covers up to 800 posts in the 10-day window) concurrently
  const pages = [1, 2, 3, 4, 5, 6, 7, 8];
  const pagesData = await Promise.all(pages.map((p) => fetchPage(p, afterIso)));

  const rawPosts = pagesData.flat();

  // Deduplicate posts by ID in case of overlap
  const seenIds = new Set<number>();
  const uniquePosts: any[] = [];
  for (const post of rawPosts) {
    if (post && post.id && !seenIds.has(post.id)) {
      seenIds.add(post.id);
      uniquePosts.push(post);
    }
  }

  const allJobs: Job[] = [];
  let expiredCount = 0;

  for (const post of uniquePosts) {
    const parsed = parseWordPressPost(post);
    if (parsed) {
      if (parsed.isExpired) {
        expiredCount++;
      }
      allJobs.push(parsed);
    }
  }

  // Non-expired jobs (always active)
  const activeJobs = allJobs.filter((j) => !j.isExpired);

  // Calculate statistics only for active valid jobs
  const stats = {
    total: activeJobs.length,
    teresina: activeJobs.filter((j) => j.city.includes('Teresina')).length,
    timon: activeJobs.filter((j) => j.city.includes('Timon')).length,
    estagios: activeJobs.filter((j) => j.jobType === 'Estágio').length,
    clt: activeJobs.filter((j) => j.jobType === 'CLT').length,
    homeOffice: activeJobs.filter((j) => j.jobType === 'Home Office').length,
    jovemAprendiz: activeJobs.filter((j) => j.jobType === 'Jovem Aprendiz').length,
    gestaoComercial: activeJobs.filter((j) => j.isGestaoComercial).length,
    expiradasFiltradas: expiredCount,
  };

  const responseData: JobsResponse = {
    jobs: allJobs,
    total: activeJobs.length,
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
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const city = searchParams.get('city') || '';
    const type = searchParams.get('type') || '';
    const area = searchParams.get('area') || '';
    const hasSalary = searchParams.get('hasSalary') === 'true';

    const fullData = await getAllActiveJobs(forceRefresh);

    // By default, strictly filter out expired jobs so the user only sees valid positions
    let filteredJobs = includeExpired
      ? fullData.jobs
      : fullData.jobs.filter((j) => !j.isExpired);

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
