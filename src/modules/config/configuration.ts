const { PORT, DATABASE_URL, CORS_ORIGIN } = process.env;

export const configuration = () => ({
  port: parseInt(PORT || '4000', 10),
  database: {
    url: DATABASE_URL,
  },
  cors: {
    origin: CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
  },
});

export type Configuration = ReturnType<typeof configuration>;
