import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, Request
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AdminService } from "./admin.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("stats")
  @Roles("admin", "pa")
  @ApiOperation({ summary: "Dashboard stats" })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get("users")
  @Roles("admin")
  @ApiOperation({ summary: "Get all admin panel users" })
  getAdminUsers() {
    return this.adminService.getAllAdminUsers();
  }

  @Post("users")
  @Roles("admin")
  @ApiOperation({ summary: "Create admin panel user (syncs Firebase + MongoDB)" })
  createAdminUser(@Body() body: { name: string; email: string; password: string; adminRole: string }) {
    return this.adminService.createAdminUser(body);
  }

  @Patch("users/:id/suspend")
  @Roles("admin")
  @ApiOperation({ summary: "Suspend or reactivate admin user" })
  suspendUser(@Param("id") id: string, @Body() body: { suspended: boolean }) {
    return this.adminService.suspendAdminUser(id, body.suspended);
  }

  @Patch("users/:id/password")
  @Roles("admin")
  @ApiOperation({ summary: "Change admin user password (syncs Firebase + MongoDB)" })
  changePassword(@Param("id") id: string, @Body() body: { password: string }) {
    return this.adminService.changeAdminPassword(id, body.password);
  }

  @Delete("users/:id")
  @Roles("admin")
  @ApiOperation({ summary: "Delete admin user from Firebase + MongoDB" })
  deleteUser(@Param("id") id: string) {
    return this.adminService.deleteAdminUser(id);
  }
}
