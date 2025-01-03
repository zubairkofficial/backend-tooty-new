import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { getErrorMessage } from '../utils/errors.utils'; // Adjust path as needed


export class ErrorLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send;

    res.send = (body?: any): Response => {
      if (res.statusCode >= 400) {
        const errorCode = body?.errorCode || 0; // Expect errorCode in response body
        const errorMessage = body?.message || getErrorMessage(errorCode);

        const errorLog = {
          url: req.originalUrl,
          timestamp: new Date().toISOString(),
          errorCode,
          errorMessage,
        };

        const filePath = path.join(__dirname, '..', 'errorLogs.txt');

        // Write error log to file
        fs.appendFile(filePath, JSON.stringify(errorLog) + '\n', (err) => {
          if (err) {
            console.error('Failed to write to log file:', err.message);
          }
        });
      }

      return originalSend.call(res, body);
    };

    next();
  }
}
