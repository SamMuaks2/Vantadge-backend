import { Controller, Post, Body, Patch, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AdminAuthService } from "./admin-auth.service";

@ApiTags("auth")
@Controller("auth/admin")
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.adminAuthService.login(body.email, body.password);
  }

  @Patch("change-password")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    return this.adminAuthService.changeOwnPassword(
      req.user._id.toString(),
      body.currentPassword,
      body.newPassword
    );
  }
}
