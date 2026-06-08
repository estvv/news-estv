import type { PapersResponse, Summary } from '../types';

const API_BASE = '/api';

export async function getArxivPapers(offset: number = 0, limit: number = 10): Promise<PapersResponse> {
  const params = new URLSearchParams({ offset: offset.toString(), limit: limit.toString() });
  const response = await fetch(`${API_BASE}/papers/arxiv?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch arXiv papers');
  }
  return response.json();
}

export async function getConfig(): Promise<{ categories: any[] }> {
  const response = await fetch(`${API_BASE}/config`);
  if (!response.ok) {
    throw new Error('Failed to fetch config');
  }
  return response.json();
}

export async function getSummaries(papers: Array<{ id: string; title: string; abstract: string; source: 'huggingface' | 'arxiv' }>): Promise<Map<string, Summary>> {
  const response = await fetch(`${API_BASE}/papers/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ papers }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch summaries');
  }
  
  const data = await response.json();
  const summaryMap = new Map<string, Summary>();
  
  for (const summary of (data.summaries || [])) {
    if (summary && summary.paperId) {
      summaryMap.set(summary.paperId, summary);
    }
  }
  
  return summaryMap;
}