// ─── programs.module.ts ───────────────────────────────────────────────────────
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Program, ProgramSchema } from "./schemas/program.schema";

export const ProgramsMongooseModule = MongooseModule.forFeature([
  { name: Program.name, schema: ProgramSchema },
]);
