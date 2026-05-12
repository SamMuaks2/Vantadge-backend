import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { TestimonialsService } from "./testimonials.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("testimonials")
@Controller("testimonials")
export class TestimonialsController {
  constructor(private service: TestimonialsService) {}

  @Get("approved")
  getApproved() { return this.service.getApproved(); }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa", "communications")
  getAll(@Query("status") status?: string) { return this.service.getAll(status); }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  create(@Request() req: any, @Body() body: any) {
    return this.service.create({ ...body, user: req.user._id });
  }

  @Patch(":id/status")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa", "communications")
  updateStatus(@Param("id") id: string, @Body() body: { status: "approved" | "rejected" }) {
    return this.service.updateStatus(id, body.status);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa")
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
