import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Tabs } from './components/Tabs';
import { PaperCard } from './components/PaperCard';
import { LoadingState } from './components/LoadingState';
import { PaperDetail } from './components/PaperDetail';
import { LoginPage } from './components/LoginPage';
import { getArxivPapers, getConfig } from './services/api';
import type { PaperWithSummary, ArxivCategory } from './types';

function HomePage() {
  const [activeTab] = useState<'arxiv-papers'>('arxiv-papers');
  const [arxivPapers, setArxivPapers] = useState<PaperWithSummary[]>([]);
  const [categories, setCategories] = useState<ArxivCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadConfig();
    loadPapers();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await getConfig();
      setCategories(config.categories || []);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const loadPapers = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const offset = reset ? 0 : arxivPapers.length;
      const data = await getArxivPapers(offset, 10);
      if (reset) {
        setArxivPapers(data.papers || []);
      } else {
        setArxivPapers(prev => [...prev, ...(data.papers || [])]);
      }
      setHasMore(data.hasMore);
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load papers');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleShowMore = async () => {
    setLoadingMore(true);
    await loadPapers(false);
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => loadPapers()}
            className="mt-4 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (arxivPapers.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-neutral-400 text-sm">No papers found</p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-3">
          {arxivPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} categories={categories} />
          ))}
        </div>
        
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={handleShowMore}
              disabled={loadingMore}
              className="px-6 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading...' : 'Show More'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <Layout>
      <Tabs activeTab={activeTab} />
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/paper/:source/:id" element={<PaperDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;