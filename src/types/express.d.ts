import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
        username?: string;
        language_code?: string;
        role: string;
      };
    }
  }
}

export {};