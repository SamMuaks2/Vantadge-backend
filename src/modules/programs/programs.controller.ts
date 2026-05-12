import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ProgramsService } from "./programs.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("programs")
@Controller("programs")
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  @Get()
  findAll() { return this.programsService.findAll(); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.programsService.findOne(id); }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "trainer")
  create(@Body() body: any) { return this.programsService.create(body); }

  @Put(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "trainer")
  update(@Param("id") id: string, @Body() body: any) { return this.programsService.update(id, body); }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  remove(@Param("id") id: string) { return this.programsService.remove(id); }
}
