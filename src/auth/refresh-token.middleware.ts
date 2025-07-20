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

    // Case 1: User has only refresh token (no access token)
    if (!accessToken && refreshToken) {
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
        // If refresh fails, clear refresh token
        res.clearCookie('refresh_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
      }
    }
    // Case 2: User has both tokens - check if access token needs refresh
    else if (accessToken && refreshToken) {
      try {
        // Decode the access token to check expiration (without verification to avoid throwing on expired tokens)
        const decoded = this.jwtService.decode(accessToken) as any;
        
        if (decoded && decoded.exp) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = decoded.exp - now;
          
          // If token is expired or expires in less than 5 minutes, refresh it
          if (timeUntilExpiry <= 0 || timeUntilExpiry < 300) {
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
              res.clearCookie('access_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              });
              res.clearCookie('refresh_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              });
            }
          }
        }
      } catch (error) {
        // If token decode fails, try to refresh using refresh token
        if (refreshToken) {
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
          } catch (refreshError) {
            // Clear both cookies if refresh fails
            res.clearCookie('access_token', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            });
            res.clearCookie('refresh_token', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            });
          }
        }
      }
    }

    next();
  }
}