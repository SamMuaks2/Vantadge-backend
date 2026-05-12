import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { ContactService } from "./contact.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("contact")
@Controller("contact")
export class ContactController {
  constructor(private service: ContactService) {}

  @Post()
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  create(@Body() body: { name: string; email: string; subject: string; message: string }) {
    return this.service.create(body);
  }

  @Get("messages")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa", "communications")
  findAll() { return this.service.findAll(); }

  @Patch("messages/:id/read")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa", "communications")
  markRead(@Param("id") id: string) { return this.service.markRead(id); }

  @Post("messages/:id/reply")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa", "communications")
  reply(@Param("id") id: string, @Body() body: { reply: string }) {
    return this.service.reply(id, body.reply);
  }

  @Delete("messages/:id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa")
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
