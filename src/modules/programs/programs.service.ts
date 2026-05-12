import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Program, ProgramDocument } from "./schemas/program.schema";

@Injectable()
export class ProgramsService {
  constructor(@InjectModel(Program.name) private programModel: Model<ProgramDocument>) {}

  async findAll() {
    return this.programModel.find({ active: true }).sort("price");
  }

  async findOne(id: string) {
    const p = await this.programModel.findById(id);
    if (!p) throw new NotFoundException("Programme not found");
    return p;
  }

  async create(dto: Partial<Program>) {
    return this.programModel.create(dto);
  }

  async update(id: string, dto: Partial<Program>) {
    const p = await this.programModel.findByIdAndUpdate(id, dto, { new: true });
    if (!p) throw new NotFoundException("Programme not found");
    return p;
  }

  async remove(id: string) {
    return this.programModel.findByIdAndDelete(id);
  }
}
