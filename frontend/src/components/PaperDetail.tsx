import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { PaperWithSummary, ArxivCategory } from '../types';
import { getArxivPapers, getSummaries } from '../services/api';
import { getTagColor } from '../utils/tagColors';
import { isAuthenticated } from '../utils/auth';

export function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<PaperWithSummary | null>(null);
  const [categories, setCategories] = useState<ArxivCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadPaper();
  }, [id]);

  const parseMarkdown = (text: string): React.ReactNode => {
    // Parse markdown formatting: **bold**, *italic*, __underline__
    const parts: Array<string | React.ReactNode> = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Match patterns: **bold**, *italic*, __underline__
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/\*(.+?)\*/);
      const underlineMatch = remaining.match(/__(.+?)__/);

      // Find the earliest match
      const matches = [
        boldMatch && { type: 'bold', match: boldMatch, index: boldMatch.index! },
        italicMatch && { type: 'italic', match: italicMatch, index: italicMatch.index! },
        underlineMatch && { type: 'underline', match: underlineMatch, index: underlineMatch.index! }
      ].filter(Boolean) as Array<{ type: string; match: RegExpMatchArray; index: number }>;

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      const earliest = matches.sort((a, b) => a.index - b.index)[0];

      // Add text before match
      if (earliest.index > 0) {
        parts.push(remaining.substring(0, earliest.index));
      }

      // Add formatted element
      const content = earliest.match[1];
      if (earliest.type === 'bold') {
        parts.push(<strong key={keyIndex++} className="font-semibold text-black">{content}</strong>);
      } else if (earliest.type === 'italic') {
        parts.push(<em key={keyIndex++} className="italic">{content}</em>);
      } else if (earliest.type === 'underline') {
        parts.push(<u key={keyIndex++} className="underline">{content}</u>);
      }

      // Continue with remaining text
      remaining = remaining.substring(earliest.index + earliest.match[0].length);
    }

    return <>{parts}</>;
  };

  const loadPaper = async () => {
    setLoading(true);
    try {
      const data = await getArxivPapers(0, 100);
      const foundPaper = data.papers.find((p: PaperWithSummary) => p.id === id);
      if (foundPaper) {
        setPaper(foundPaper);
        if (data.categories) {
          setCategories(data.categories);
        }
      }
    } catch (error) {
      console.error('Failed to load paper:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (paperData: PaperWithSummary) => {
    setLoadingSummary(true);
    try {
      const summaries = await getSummaries([{
        id: paperData.id,
        title: paperData.title,
        abstract: paperData.abstract,
        source: 'arxiv'
      }]);
      
      const summary = summaries.get(paperData.id);
      if (summary) {
        setPaper(prev => prev ? { ...prev, summary } : null);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        navigate('/login');
      }
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-neutral-400 text-sm text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-neutral-400 text-sm text-center">Paper not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 block mx-auto text-sm text-neutral-600 hover:text-neutral-900"
          >
            ← Back to list
          </button>
        </div>
      </div>
    );
  }

  const authors = paper.authors.length > 2
    ? `${paper.authors.slice(0, 2).join(', ')}, et al.`
    : paper.authors.join(', ');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <button
          onClick={() => navigate('/')}
          className="mb-8 text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>

        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-4">{paper.title}</h1>
            {paper.categories && paper.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {paper.categories.map((category) => {
                  const color = getTagColor(category, categories);
                  return (
                    <span
                      key={category}
                      className={`px-3 py-1 text-sm font-medium rounded border ${color.bg} ${color.text} ${color.border}`}
                    >
                      {category}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="text-sm text-neutral-600 mb-2">{authors}</div>
            <div className="text-sm text-neutral-400 mb-6">{formatDate(paper.publishedDate)}</div>
            
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg px-4 py-2 hover:bg-neutral-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              View PDF
            </a>
          </header>

          {loadingSummary ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 text-sm">Generating summary...</p>
            </div>
          ) : paper.summary ? (
            <div className="space-y-4 mb-8">
              <section className="border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-black">Resume</h2>
                </div>
                <p className="text-neutral-700 leading-relaxed">{parseMarkdown(paper.summary.resume)}</p>
              </section>

              <section className="border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h2 className="text-lg font-semibold text-black">Definitions</h2>
                </div>
                <ul className="space-y-2">
                  {(paper.summary.definitions || []).map((def, index) => {
                    const parts = def.split(':');
                    const term = parts[0]?.trim() || '';
                    const definition = parts.slice(1).join(':').trim();
                    
                    return (
                      <li key={index} className="flex items-start gap-2 text-neutral-700">
                        <span className="text-neutral-400 mt-0.5">•</span>
                        <span>
                          <strong className="font-semibold text-black">{parseMarkdown(term)}</strong>
                          {definition && <span className="text-green-700">: {parseMarkdown(definition)}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-black">Problem</h2>
                </div>
                <ul className="space-y-2">
                  {(paper.summary.problem?.points || []).map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-neutral-700">
                      <span className="text-neutral-400 mt-0.5">•</span>
                      <span>{parseMarkdown(point)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-black">Solution</h2>
                </div>
                <ul className="space-y-2">
                  {(paper.summary.solution?.points || []).map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-neutral-700">
                      <span className="text-neutral-400 mt-0.5">•</span>
                      <span>{parseMarkdown(point)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <div className="text-center py-12">
              {isAuthenticated() ? (
                <button
                  onClick={() => loadSummary(paper)}
                  className="text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg px-6 py-3 hover:bg-neutral-50 transition-colors"
                >
                  Generate Summary
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-neutral-600 text-sm">Login required to generate AI summaries</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg px-6 py-3 transition-colors"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}