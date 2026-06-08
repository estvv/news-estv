export interface Config {
  categories: {
    arxiv: ArxivCategory[];
    huggingface: {
      models: { maxResults: number; sortBy: string };
      papers: { maxResults: number };
    };
    cache: { ttlSeconds: number };
    llm: {
      enabled: boolean;
      maxBulletPoints: number;
      model: string;
      timeout: number;
      maxRetries: number;
      batchSize: number;
      batchDelay: number;
    };
  };
}

export interface ArxivCategory {
  id: string;
  name: string;
  color: string;
}

export interface Model {
  id: string;
  name: string;
  downloads: number;
  likes: number;
  tags: string[];
  task: string;
  url: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  categories: string[];
  url: string;
  source: 'huggingface' | 'arxiv';
}

export interface SummarySection {
  points: string[];
}

export interface SummaryContent {
  resume: string;
  definitions: string[];
  problem: SummarySection;
  solution: SummarySection;
}

export interface Summary {
  paperId: string;
  source: 'huggingface' | 'arxiv';
  en: SummaryContent;
  fr: SummaryContent;
  generatedAt: string;
  cached: boolean;
}

export interface PaperWithSummary extends Paper {
  summary?: Summary;
}

export interface ModelsResponse {
  models: Model[];
  hasMore: boolean;
  timestamp: string;
}

export interface PapersResponse {
  papers: PaperWithSummary[];
  hasMore: boolean;
  categories?: ArxivCategory[];
  timestamp: string;
}

export interface SummarizeRequest {
  papers: Array<{
    id: string;
    title: string;
    abstract: string;
    source: 'huggingface' | 'arxiv';
  }>;
}

export interface SummarizeResponse {
  summaries: Summary[];
}