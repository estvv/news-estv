export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-2xl font-bold text-black mb-1">News</h1>
        </header>
        {children}
        <footer className="mt-16 text-neutral-400 text-xs text-center">
          <p>Data sourced from HuggingFace and arXiv</p>
        </footer>
      </div>
    </div>
  );
}