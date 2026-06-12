import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.signup(email, password);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.login(email, password);
  }
}