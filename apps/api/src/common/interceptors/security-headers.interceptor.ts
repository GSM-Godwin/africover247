import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.setHeader(
          'Permissions-Policy',
          'camera=(), microphone=(), geolocation=()',
        );
      }),
    );
  }
}
