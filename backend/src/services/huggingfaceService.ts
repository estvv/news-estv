import type { Model, Paper } from '../types/index.js';

interface HFModel {
  id: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  modelId: string;
}

interface HFPaper {
  id: string;
  title: string;
  authors: string[] | Array<{name: string; _id: string; hidden: boolean}>;
  summary?: string;
  abstract?: string;
  publishedAt: string;
  categories?: string[];
}

export class HuggingFaceService {
  private readonly baseUrl = 'https://huggingface.co/api';

  async getModels(maxResults: number, sortBy: string, offset: number = 0): Promise<{ models: Model[]; hasMore: boolean }> {
    try {
      const fetchLimit = maxResults + 1;
      const params = new URLSearchParams({
        limit: fetchLimit.toString(),
        sort: sortBy,
        direction: '-1',
      });

      const response = await fetch(`${this.baseUrl}/models?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const allModels = await response.json() as HFModel[];
      const paginatedModels = allModels.slice(offset, offset + maxResults + 1);
      const hasMore = paginatedModels.length > maxResults;
      const models = paginatedModels.slice(0, maxResults);

      return {
        models: models.map((model) => ({
          id: model.id,
          name: model.modelId || model.id,
          downloads: model.downloads || 0,
          likes: model.likes || 0,
          tags: model.tags || [],
          task: model.pipeline_tag || 'unknown',
          url: `https://huggingface.co/${model.id}`,
        })),
        hasMore
      };
    } catch (error) {
      console.error('Error fetching HuggingFace models:', error);
      throw error;
    }
  }

  async getPapers(maxResults: number, offset: number = 0): Promise<{ papers: Paper[]; hasMore: boolean }> {
    try {
      const fetchLimit = maxResults + 1;
      const params = new URLSearchParams({
        limit: fetchLimit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/papers?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch papers: ${response.statusText}`);
      }

      const allPapers = await response.json() as HFPaper[];
      const paginatedPapers = allPapers.slice(offset, offset + maxResults + 1);
      const hasMore = paginatedPapers.length > maxResults;
      const papers = paginatedPapers.slice(0, maxResults);

      return {
        papers: papers.map((paper) => ({
          id: paper.id,
          title: paper.title,
          authors: Array.isArray(paper.authors) 
            ? paper.authors.map((a: any) => typeof a === 'string' ? a : (a.name || 'Unknown'))
            : [],
          abstract: paper.summary || paper.abstract || '',
          publishedDate: paper.publishedAt,
          categories: paper.categories || [],
          url: `https://huggingface.co/papers/${paper.id}`,
          source: 'huggingface' as const,
        })),
        hasMore
      };
    } catch (error) {
      console.error('Error fetching HuggingFace papers:', error);
      throw error;
    }
  }
}

export const huggingfaceService = new HuggingFaceService();