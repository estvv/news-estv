import type { Summary } from '../types/index.js';
import { getConfig } from '../config/index.js';

interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class LLMService {
  private model: string;
  private timeout: number;
  private maxRetries: number;

  constructor() {
    try {
      const config = getConfig();
      this.model = config.categories.llm.model;
      this.timeout = config.categories.llm.timeout;
      this.maxRetries = config.categories.llm.maxRetries;
    } catch {
      this.model = 'mistral-small-latest';
      this.timeout = 10000;
      this.maxRetries = 3;
    }
  }

  private getApiKey(): string {
    const key = process.env.MISTRAL_API_KEY || '';
    if (!key) {
      console.warn('[LLM Service] MISTRAL_API_KEY not set');
    }
    return key;
  }

  async summarizePaper(
    paper: { title: string; abstract: string },
    paperId: string,
    source: 'huggingface' | 'arxiv'
  ): Promise<Summary | null> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.warn('[LLM Service] No API key configured');
      return null;
    }

    if (!paper.abstract || paper.abstract.trim().length < 50) {
      console.warn(`[LLM Service] Abstract too short for paper ${paperId}`);
      return null;
    }

    const prompt = this.buildPrompt(paper.title, paper.abstract);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        console.log(`[LLM Service] Attempting to summarize paper ${paperId} (attempt ${attempt + 1}/${this.maxRetries})`);
        const response = await this.callMistral(prompt, apiKey);
        console.log(`[LLM Service] Received response for paper ${paperId}, length: ${response.length}`);
        const parsed = this.parseResponse(response);

        console.log(`[LLM Service] Successfully parsed summary for paper ${paperId}:`, {
          resume: parsed.resume.substring(0, 30) + '...',
          definitions: parsed.definitions.length,
          sections: {
            problem: parsed.problem.points.length,
            solution: parsed.solution.points.length
          }
        });

        return {
          paperId,
          source,
          resume: parsed.resume,
          definitions: parsed.definitions || [],
          problem: parsed.problem,
          solution: parsed.solution,
          generatedAt: new Date().toISOString(),
          cached: false,
        };
      } catch (error) {
        console.error(`[LLM Service] Attempt ${attempt + 1} failed for paper ${paperId}:`, error);
        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    console.error(`[LLM Service] All attempts failed for paper ${paperId}`);
    return null;
  }

  private buildPrompt(title: string, abstract: string): string {
    return `Summarize this research paper concisely in French.

Title: ${title}

Abstract: ${abstract}

Output ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "resume": "Two concise sentences in French explaining what this paper does and why it matters.",
  "definitions": [
    "Term1: its definition in French",
    "Term2: its definition in French",
    "Term3: its definition in French"
  ],
  "problem": {
    "points": [
      "What problem does this solve? (in French)",
      "Why does it matter? (in French)",
      "What gap does it fill? (in French)"
    ]
  },
  "solution": {
    "points": [
      "What's the key approach? (in French)",
      "What's innovative? (in French)",
      "How is it different? (in French)"
    ]
  }
}

IMPORTANT: Use markdown formatting to highlight key information:
- **bold** for important terms, key concepts, method names, datasets, metrics, and significant findings (USE THIS MOST OFTEN)
- *italic* for technical terms and subtle emphasis (use sparingly)
- __underline__ for critical breakthrough results or major contributions (use rarely)

Examples: 
- "**MSK-NN** achieves **15.6% improvement** over baselines"
- "The model uses *transformer-based* architecture with **multi-head attention**"
- "Our approach achieves __state-of-the-art performance__ on **three benchmarks**"

Prefer **bold** for most emphasis. Use it liberally for important nouns, numbers, and key concepts throughout all sections.

Write 2 sentences for resume (maximum 30 words total). Write 3-5 technical term definitions in "definitions" array. Each definition: "Term: brief explanation" format (5-15 words per definition). Include abbreviations, methods, and key concepts. Write 3 bullet points per section. Each bullet: 1 short sentence maximum (10-15 words). Be direct and factual. No fluff. Use formatting for emphasis. Ensure complete JSON. ALL TEXT MUST BE IN FRENCH.`;
  }

  private async callMistral(prompt: string, apiKey: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a concise research paper summarizer writing in French. Write brief, factual bullets. Maximum 1 sentence per bullet, 10-15 words. Be direct. No elaboration. Always return valid JSON in French.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        temperature: 0.3,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.statusText}`);
      }

      const data = await response.json() as MistralResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Mistral API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private parseResponse(response: string): { resume: string; definitions: string[]; problem: any; solution: any } {
    try {
      let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleaned);

      if (!parsed.resume || !parsed.definitions || !parsed.problem || !parsed.solution) {
        throw new Error('Missing required sections in response');
      }

      const config = getConfig();
      const maxPoints = config?.categories.llm.maxBulletPoints || 15;

      const safeSlice = (arr: any[] = []) => arr.slice(0, maxPoints).map((p: string) => p.trim());
      
      return {
        resume: (parsed.resume || '').trim(),
        definitions: Array.isArray(parsed.definitions) ? parsed.definitions.map((d: string) => d.trim()) : [],
        problem: {
          points: safeSlice(parsed.problem?.points)
        },
        solution: {
          points: safeSlice(parsed.solution?.points)
        }
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Raw response:', response);
      throw new Error(`Invalid JSON response from LLM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async summarizePapers(
    papers: Array<{ id: string; title: string; abstract: string; source: 'huggingface' | 'arxiv' }>
  ): Promise<Summary[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return [];
    }

    let config;
    try {
      config = getConfig();
    } catch {
      config = null;
    }
    const batchSize = config?.categories.llm.batchSize || 5;
    const batchDelay = config?.categories.llm.batchDelay || 1000;

    const summaries: Summary[] = [];

    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);

      const batchPromises = batch.map((paper) => 
        this.summarizePaper(paper, paper.id, paper.source)
      );

      const batchSummaries = await Promise.all(batchPromises);
      summaries.push(...batchSummaries.filter((s): s is Summary => s !== null));

      if (i + batchSize < papers.length) {
        await new Promise((resolve) => setTimeout(resolve, batchDelay));
      }
    }

    return summaries;
  }
}

export const llmService = new LLMService();