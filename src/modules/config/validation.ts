import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().required(),
  CORS_ORIGIN: Joi.string().optional(),
});
