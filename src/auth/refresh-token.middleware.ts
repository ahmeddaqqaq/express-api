import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class RefreshTokenMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;

    if (accessToken && refreshToken) {
      try {
        // Decode the access token to check expiration (without verification to avoid throwing on expired tokens)
        const decoded = this.jwtService.decode(accessToken) as any;
        
        if (decoded && decoded.exp) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = decoded.exp - now;
          
          // If token expires in less than 5 minutes, refresh it
          if (timeUntilExpiry < 300) {
            try {
              const newTokens = await this.authService.refreshTokens(refreshToken);
              
              // Set new cookies
              res.cookie('access_token', newTokens.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000, // 15 minutes
                path: '/',
              });

              res.cookie('refresh_token', newTokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/',
              });

              // Update the request cookies for this request
              req.cookies.access_token = newTokens.access_token;
              req.cookies.refresh_token = newTokens.refresh_token;

              // Add header to let frontend know tokens were refreshed
              res.setHeader('X-Token-Refreshed', 'true');
              res.setHeader('X-New-Access-Token', newTokens.access_token);
            } catch (error) {
              // If refresh fails, clear cookies and let the request continue
              // The auth guard will handle the unauthorized access
              res.clearCookie('access_token');
              res.clearCookie('refresh_token');
            }
          }
        }
      } catch (error) {
        // If token decode fails, continue without refreshing
        // The auth guard will handle invalid tokens
      }
    }

    next();
  }
}