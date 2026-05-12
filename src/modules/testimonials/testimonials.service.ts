import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Testimonial, TestimonialDocument } from "./schemas/testimonial.schema";

@Injectable()
export class TestimonialsService {
  constructor(@InjectModel(Testimonial.name) private model: Model<TestimonialDocument>) {}

  async getApproved() {
    return this.model.find({ status: "approved" }).sort("-createdAt");
  }

  async getAll(status?: string) {
    const q: any = {};
    if (status) q.status = status;
    return this.model.find(q).sort("-createdAt");
  }

  async create(dto: any) {
    return this.model.create({ ...dto, status: "pending" });
  }

  async updateStatus(id: string, status: "approved" | "rejected") {
    const t = await this.model.findByIdAndUpdate(id, { status }, { new: true });
    if (!t) throw new NotFoundException("Testimonial not found");
    return t;
  }

  async remove(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}
