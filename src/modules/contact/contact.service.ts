import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ContactMessage, ContactMessageDocument } from "./schemas/contact.schema";
import { EmailService } from "../email/email.service";

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(ContactMessage.name) private model: Model<ContactMessageDocument>,
    private emailService: EmailService
  ) {}

  async create(dto: { name: string; email: string; subject: string; message: string }) {
    return this.model.create(dto);
  }

  async findAll() {
    return this.model.find().sort("-createdAt");
  }

  async markRead(id: string) {
    return this.model.findByIdAndUpdate(id, { read: true }, { new: true });
  }

  async reply(id: string, reply: string) {
    const msg = await this.model.findByIdAndUpdate(id, { replied: true }, { new: true });
    if (!msg) throw new NotFoundException("Message not found");
    await this.emailService.sendContactReply(msg.email, msg.name, msg.subject, reply);
    return msg;
  }

  async remove(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}
