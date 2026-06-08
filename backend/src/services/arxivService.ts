import type { Paper, ArxivCategory } from '../types/index.js';

interface ArxivEntry {
  id: string;
  title: string;
  author: Array<{ name: string }>;
  summary: string;
  published: string;
  category: Array<{ term: string }>;
  link: Array<{ href: string; rel?: string; type?: string }>;
}

export class ArxivService {
  private readonly baseUrl = 'http://export.arxiv.org/api/query';

  async getPapers(categories: ArxivCategory[], maxResults: number, offset: number = 0): Promise<{ papers: Paper[]; hasMore: boolean }> {
    try {
      const fetchLimit = maxResults + 1;
      const categoryQuery = categories.map((cat) => `cat:${cat.id}`).join(' OR ');
      const params = new URLSearchParams({
        search_query: categoryQuery,
        start: offset.toString(),
        max_results: fetchLimit.toString(),
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch arXiv papers: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const allPapers = this.parseArxivResponse(xmlText);
      const hasMore = allPapers.length > maxResults;
      const papers = allPapers.slice(0, maxResults);

      return { papers, hasMore };
    } catch (error) {
      console.error('Error fetching arXiv papers:', error);
      throw error;
    }
  }

  private parseArxivResponse(xmlText: string): Paper[] {
    const papers: Paper[] = [];
    
    const entries = xmlText.split('<entry>').slice(1);
    
    for (const entry of entries) {
      try {
        const idMatch = entry.match(/<id>([^<]+)<\/id>/);
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
        const summaryMatch = entry.match(/<summary>([^<]+)<\/summary>/);
        const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
        
        const authors: string[] = [];
        const authorMatches = entry.matchAll(/<author>\s*<name>([^<]+)<\/name>\s*<\/author>/g);
        for (const match of authorMatches) {
          authors.push(match[1]);
        }
        
        const categories: string[] = [];
        const categoryMatches = entry.matchAll(/<category[^>]*term="([^"]+)"[^>]*>/g);
        for (const match of categoryMatches) {
          categories.push(match[1]);
        }
        
        const pdfLink = this.extractPdfLink(entry);
        
        if (idMatch && titleMatch) {
          papers.push({
            id: idMatch[1].replace('http://arxiv.org/abs/', '').replace('http://arxiv.org/pdf/', ''),
            title: titleMatch[1].replace(/\s+/g, ' ').trim(),
            authors: authors.slice(0, 2),
            abstract: summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '',
            publishedDate: publishedMatch ? publishedMatch[1] : '',
            categories: categories.filter(c => c.startsWith('cs.')),
            url: this.extractPdfLink(entry),
            source: 'arxiv' as const,
          });
        }
      } catch (error) {
        console.error('Error parsing arXiv entry:', error);
      }
    }
    
    return papers;
  }

  private extractPdfLink(entry: string): string {
    const idMatch = entry.match(/<id>([^<]+)<\/id>/);
    if (!idMatch) {
      return '';
    }
    
    const arxivId = idMatch[1].replace('http://arxiv.org/abs/', '').replace('http://arxiv.org/pdf/', '');
    return `https://arxiv.org/pdf/${arxivId}.pdf`;
  }
}

export const arxivService = new ArxivService();