import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { getErrorMessage } from '../utils/errors.utils'; // Adjust path as needed

@Injectable()
export class ErrorLoggerMiddleware implements NestMiddleware {
  private logFilePath = path.join(__dirname, '..', 'errorLogs.txt');

  async use(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send;

    res.send = (body?: any): Response => {
      if (res.statusCode >= 400) {
        const errorCode = body?.errorCode || 0;
        const errorMessage = body?.message || getErrorMessage(errorCode);

        const errorLog = {
          url: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString(),
          errorCode,
          errorMessage,
        };

        this.logErrorToFile(errorLog);
      }

      return originalSend.call(res, body);
    };

    next();
  }

  private async logErrorToFile(errorLog: object) {
    try {
      // Ensure log file exists, if not create it
      if (!fs.existsSync(this.logFilePath)) {
        fs.writeFileSync(this.logFilePath, '', { flag: 'w' });
      }

      // Append error log to the file
      await fs.promises.appendFile(this.logFilePath, JSON.stringify(errorLog) + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err.message);
    }
  }
}
