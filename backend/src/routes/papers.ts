import { Router, type Request, type Response } from 'express';
import { arxivService } from '../services/arxivService.js';
import { llmService } from '../services/llmService.js';
import { cacheService } from '../services/cacheService.js';
import { getConfig } from '../config/index.js';
import type { PaperWithSummary, Summary, ArxivCategory } from '../types/index.js';

export function papersRoutes(router: Router): void {
  router.get('/papers/arxiv', async (req: Request, res: Response) => {
    try {
      const config = getConfig();
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const cacheKey = `arxiv:papers:${offset}:${limit}`;
      
      const cached = cacheService.get<{ papers: any[], hasMore: boolean, categories: ArxivCategory[], timestamp: string }>(cacheKey);
      if (cached) {
        const papersWithSummaries = await addSummaries(cached.papers, 'arxiv');
        return res.json({ ...cached, papers: papersWithSummaries });
      }

      const categories = config.categories.arxiv;
      const { papers, hasMore } = await arxivService.getPapers(categories, limit, offset);
      
      const response = {
        papers,
        hasMore,
        categories,
        timestamp: new Date().toISOString()
      };
      
      cacheService.set(cacheKey, response, config.categories.cache.ttlSeconds);
      
      const papersWithSummaries = await addSummaries(papers, 'arxiv');
      res.json({ ...response, papers: papersWithSummaries });
    } catch (error) {
      console.error('Error in /papers/arxiv route:', error);
      res.status(500).json({
        error: 'Failed to fetch arXiv papers',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/papers/summarize', async (req: Request, res: Response) => {
    try {
      const { papers } = req.body;

      if (!Array.isArray(papers)) {
        return res.status(400).json({ error: 'Papers must be an array' });
      }

      const papersToSummarize = papers.filter((p: any) => {
        // Always fetch fresh summaries - don't use cache
        return p.abstract && p.abstract.trim().length >= 50;
      });

      let newSummaries: Summary[] = [];
      if (papersToSummarize.length > 0) {
        try {
          newSummaries = await llmService.summarizePapers(papersToSummarize);
          // Don't cache - regenerate on each request
        } catch (error) {
          console.error('Error generating summaries:', error);
        }
      }

      const result: Summary[] = papers
        .map((p: any) => newSummaries.find((s: Summary) => s.paperId === p.id))
        .filter((s): s is Summary => s !== null && s !== undefined);

      res.json({ summaries: result });
    } catch (error) {
      console.error('Error in /papers/summarize route:', error);
      res.status(500).json({
        error: 'Failed to summarize papers',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/config', (_req: Request, res: Response) => {
    const config = getConfig();
    res.json({
      categories: config.categories.arxiv
    });
  });
}

async function addSummaries(papers: any[], source: 'arxiv'): Promise<PaperWithSummary[]> {
  // Don't add summaries automatically - they will be generated on demand
  return papers.map(paper => ({
    ...paper,
    summary: undefined
  }));
}