import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Program, ProgramSchema } from "./schemas/program.schema";
import { ProgramsController } from "./programs.controller";
import { ProgramsService } from "./programs.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Program.name, schema: ProgramSchema }])],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService, MongooseModule],
})
export class ProgramsModule {}
