import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

/**
 * Middleware that captures raw request body for webhook signature verification.
 * Stripe and other payment providers require the raw body to verify signatures.
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  private readonly jsonParser = json({
    verify: (req: RequestWithRawBody, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  });

  use(req: RequestWithRawBody, res: Response, next: NextFunction): void {
    this.jsonParser(req, res, next);
  }
}
