import { Controller, Post, Get, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const { user, accessToken } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  }

  @Post('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple OAuth login' })
  async appleAuth() {
    // Guard handles Apple authentication
  }

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple OAuth callback' })
  async appleAuthCallback(@Req() req, @Res() res: Response) {
    const { user, accessToken } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: 'Initiate Kakao OAuth login' })
  async kakaoAuth() {
    // Guard redirects to Kakao
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: 'Kakao OAuth callback' })
  async kakaoAuthCallback(@Req() req, @Res() res: Response) {
    const { user, accessToken } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  }
}
