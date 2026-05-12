import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { BlogService } from "./blog.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("blog")
@Controller("blog")
export class BlogController {
  constructor(private service: BlogService) {}

  @Get()
  findAll(@Query("limit") limit?: string, @Query("skip") skip?: string) {
    return this.service.findAll(Number(limit) || 20, Number(skip) || 0);
  }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "communications")
  create(@Request() req: any, @Body() body: any) {
    return this.service.create(body, req.user._id.toString());
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "communications")
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
