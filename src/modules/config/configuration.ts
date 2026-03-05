const { PORT, DATABASE_URL, CORS_ORIGIN, API_TITLE, API_DESCRIPTION, API_VERSION } = process.env;

export const configuration = () => ({
  port: parseInt(PORT || '4000', 10),
  database: {
    url: DATABASE_URL,
  },
  cors: {
    origin: CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
  },
  api: {
    title: API_TITLE || 'Marketplace API',
    description: API_DESCRIPTION || 'REST API for marketplace application',
    version: API_VERSION || '0.0.1',
  },
});

export type Configuration = ReturnType<typeof configuration>;
