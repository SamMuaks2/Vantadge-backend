import {
  Controller, Post, Body, UseGuards, Request, Get, Patch
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: "Register a new member" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @UseGuards(AuthGuard("local"))
  @ApiOperation({ summary: "Login with email & password" })
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Post("google")
  @ApiOperation({ summary: "Google OAuth upsert" })
  googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @Post("forgot-password")
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: "Request password reset link" })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password with token" })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
  
  @Post("reset-password-by-email")
  @ApiOperation({ summary: "Sync Firebase password reset to MongoDB (called after Firebase confirmPasswordReset)" })
  resetPasswordByEmail(
    @Body() body: { email: string; newPassword: string }
  ) {
    return this.authService.resetPasswordByEmail(body.email, body.newPassword);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Get current authenticated user" })
  me(@Request() req: any) {
    return req.user;
  }
}
