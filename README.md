# news-estv

News aggregator for HuggingFace models/papers and arXiv CS papers with configurable categories.

## Features

- **HuggingFace Models**: Browse trending ML models
- **HuggingFace Papers**: Read latest ML research papers
- **arXiv Papers**: CS research papers from configurable categories
- **Configurable**: Customize which arXiv categories to fetch
- **Tag Colors**: Category-specific color coding
- **Cache**: 5-minute TTL for optimal performance

## Quick Start

```bash
# Pull changes
make pull

# Start services
make up

# Stop services
make down

# Rebuild and restart
make update
```

## Architecture

```
Caddy (host) → news-frontend-estv:80 (nginx + React)
             → news-backend-estv:8080 (Node + Express)
```

## Configuration

Edit `config.json` to customize:

- **arXiv categories**: Add/remove CS categories (cs.AI, cs.LG, etc.)
- **Results count**: Adjust number of items to fetch
- **Cache TTL**: Modify cache duration (default: 300 seconds)

## Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/models` - HuggingFace models
- `GET /api/papers/hf` - HuggingFace papers
- `GET /api/papers/arxiv` - arXiv papers
- `GET /config` - Frontend config (categories)

## License

MIT