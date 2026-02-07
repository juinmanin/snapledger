import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.passwordHash) sanitizedBody.passwordHash = '***';

    this.logger.log(
      `[${method}] ${url} - User: ${user?.id || 'anonymous'} - Body: ${JSON.stringify(sanitizedBody)}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${method}] ${url} - Completed in ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${method}] ${url} - Failed in ${duration}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
