import { Injectable, NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcryptjs";
import { AdminUser, AdminUserDocument } from "./schemas/admin-user.schema";
import { FirebaseService } from "../../config/firebase.service";
import { User, UserDocument } from "../users/schemas/user.schema";
import { Booking, BookingDocument } from "../bookings/schemas/booking.schema";
import { Subscription, SubscriptionDocument } from "../subscriptions/schemas/subscription.schema";
import { Testimonial, TestimonialDocument } from "../testimonials/schemas/testimonial.schema";

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Testimonial.name) private testimonialModel: Model<TestimonialDocument>,
    private firebaseService: FirebaseService,
  ) {}

  // ─── Stats dashboard ────────────────────────────────────────────────────────
  async getDashboardStats() {
    const [totalMembers, pendingBookings, activeSubscriptions, pendingTestimonials] =
      await Promise.all([
        this.userModel.countDocuments({ role: "member" }),
        this.bookingModel.countDocuments({ status: "pending" }),
        this.subscriptionModel.countDocuments({ status: "active" }),
        this.testimonialModel.countDocuments({ status: "pending" }),
      ]);

    return { totalMembers, pendingBookings, activeSubscriptions, pendingTestimonials };
  }

  // ─── Admin Users ─────────────────────────────────────────────────────────────
  async getAllAdminUsers() {
    return this.adminUserModel.find().select("-password").sort("-createdAt");
  }

  async createAdminUser(dto: { name: string; email: string; password: string; adminRole: string }) {
    const existing = await this.adminUserModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException("Email already in use");

    // Create in Firebase
    const firebaseUid = await this.firebaseService.createUser({
      email: dto.email,
      password: dto.password,
      displayName: dto.name,
    });
    await this.firebaseService.setRole(firebaseUid, dto.adminRole);

    // Hash and save in MongoDB
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const adminUser = await this.adminUserModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      adminRole: dto.adminRole,
      firebaseUid,
    });

    const { password: _, ...result } = adminUser.toObject();
    return result;
  }

  async suspendAdminUser(id: string, suspended: boolean) {
    const user = await this.adminUserModel.findById(id);
    if (!user) throw new NotFoundException("Admin user not found");

    // Sync to Firebase
    if (user.firebaseUid) {
      await this.firebaseService.setDisabled(user.firebaseUid, suspended);
    }

    user.suspended = suspended;
    await user.save();
    return { message: suspended ? "Account suspended" : "Account reactivated" };
  }

  async changeAdminPassword(id: string, newPassword: string) {
    const user = await this.adminUserModel.findById(id);
    if (!user) throw new NotFoundException("Admin user not found");

    // Sync to Firebase
    if (user.firebaseUid) {
      await this.firebaseService.updatePassword(user.firebaseUid, newPassword);
    }

    // Update MongoDB
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.adminUserModel.findByIdAndUpdate(id, { password: hashed });

    return { message: "Password updated in all systems" };
  }

  async deleteAdminUser(id: string) {
    const user = await this.adminUserModel.findById(id);
    if (!user) throw new NotFoundException("Admin user not found");

    // Delete from Firebase
    if (user.firebaseUid) {
      await this.firebaseService.deleteUser(user.firebaseUid);
    }

    await this.adminUserModel.findByIdAndDelete(id);
    return { message: "Admin user deleted from all systems" };
  }
}
