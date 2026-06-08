import { useNavigate } from 'react-router-dom';
import type { PaperWithSummary, ArxivCategory } from '../types';
import { getTagColor } from '../utils/tagColors';

interface PaperCardProps {
  paper: PaperWithSummary;
  categories?: ArxivCategory[];
}

export function PaperCard({ paper, categories = [] }: PaperCardProps) {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const authors = paper.authors.length > 2
    ? `${paper.authors.slice(0, 2).join(', ')}, et al.`
    : paper.authors.join(', ');

  const handleClick = () => {
    navigate(`/paper/${paper.source}/${paper.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-black line-clamp-2 flex-1">{paper.title}</h3>
      </div>
      {paper.categories && paper.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {paper.categories.slice(0, 4).map((category) => {
            const color = getTagColor(category, categories);
            return (
              <span
                key={category}
                className={`px-2 py-0.5 text-xs font-medium rounded border ${color.bg} ${color.text} ${color.border}`}
              >
                {category}
              </span>
            );
          })}
          {paper.categories.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-neutral-400">
              +{paper.categories.length - 4}
            </span>
          )}
        </div>
      )}
      <div className="text-xs text-neutral-500 mb-2">{authors}</div>
      <div className="text-xs text-neutral-400 mb-3">{formatDate(paper.publishedDate)}</div>
      
      {paper.summary && (
        <div className="mb-3 pt-3 border-t border-neutral-100">
          <p className="text-xs text-neutral-600 line-clamp-2 mb-2">
            {paper.summary!.resume}
          </p>
          <div className="flex gap-3 text-xs text-neutral-400">
            <span>{paper.summary!.problem?.points?.length || 0} problem</span>
            <span>{paper.summary!.solution?.points?.length || 0} solution</span>
          </div>
        </div>
      )}
      
      <div className="text-xs text-neutral-400 mt-2">
        {paper.summary ? 'Click to view summary →' : 'Click to view →'}
      </div>
    </div>
  );
}