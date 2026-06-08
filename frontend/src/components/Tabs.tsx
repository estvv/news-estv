interface TabsProps {
  activeTab: 'arxiv-papers';
}

export function Tabs({ activeTab }: TabsProps) {
  const tabs = [
    { id: 'arxiv-papers' as const, label: 'arXiv Papers' },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="flex border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-black border-b-2 border-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}