import { Controller, Get, Put, Patch, Body, Param, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin")
  findAll() {
    return this.usersService.findAll();
  }

  @Get("profile")
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user._id.toString());
  }

  @Put("profile")
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user._id.toString(), body);
  }

  @Patch("change-password")
  changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    return this.usersService.changePassword(
      req.user._id.toString(),
      body.currentPassword,
      body.newPassword
    );
  }

  @Get(":id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }
}
