const {
  PORT,
  DATABASE_URL,
  CORS_ORIGIN,
  API_TITLE,
  API_DESCRIPTION,
  API_VERSION,
  JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  FRONTEND_URL,
  STRIPE_CHECKOUT_SUCCESS_PATH,
  STRIPE_CHECKOUT_CANCEL_PATH,
} = process.env;

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
  jwt: {
    secret: JWT_SECRET || 'change-me-in-production-use-strong-random-string',
    accessExpiresIn: JWT_ACCESS_EXPIRES_IN || '1h',
    refreshExpiresIn: JWT_REFRESH_EXPIRES_IN || '7d',
  },
  stripe: {
    secretKey: STRIPE_SECRET_KEY || '',
    webhookSecret: STRIPE_WEBHOOK_SECRET || '',
    frontendUrl: FRONTEND_URL || 'http://localhost:3000',
    successPath: STRIPE_CHECKOUT_SUCCESS_PATH || '/checkout/success',
    cancelPath: STRIPE_CHECKOUT_CANCEL_PATH || '/checkout/cancel',
  },
});

export type Configuration = ReturnType<typeof configuration>;
