import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcryptjs";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll() {
    return this.userModel.find({ role: "member" }).select("-password").sort("-createdAt");
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select("-password");
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(id: string, dto: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, dto, { new: true }).select("-password");
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(id).select("+password");
    if (!user || !user.password) throw new NotFoundException("User not found");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error("Current password is incorrect");
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return { message: "Password updated" };
  }
}
