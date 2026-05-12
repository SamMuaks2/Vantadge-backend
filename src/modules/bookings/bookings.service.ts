// import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model, Types } from "mongoose";
// import {
//   Booking, BookingDocument,
//   TimeSlot, TimeSlotDocument,
// } from "./schemas/booking.schema";
// import { EmailService } from "../email/email.service";
// import { User, UserDocument } from "../users/schemas/user.schema";

// @Injectable()
// export class BookingsService {
//   constructor(
//     @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
//     @InjectModel(TimeSlot.name) private slotModel: Model<TimeSlotDocument>,
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//     private emailService: EmailService
//   ) {}

//   // ─── Slots ──────────────────────────────────────────────────────────────────
//   async getAvailableSlots() {
//     return this.slotModel.find({ available: true, date: { $gte: new Date() } }).sort("date startTime");
//   }

//   async createSlot(dto: any) {
//     return this.slotModel.create(dto);
//   }

//   async deleteSlot(id: string) {
//     return this.slotModel.findByIdAndDelete(id);
//   }

//   // ─── Bookings ────────────────────────────────────────────────────────────────
//   async createBooking(userId: string, dto: { slotId: string; notes?: string }) {
//     const slot = await this.slotModel.findById(dto.slotId);
//     if (!slot || !slot.available) throw new BadRequestException("Slot is not available");

//     // Check if user already has a pending booking for this slot
//     const exists = await this.bookingModel.findOne({
//       user: new Types.ObjectId(userId),
//       slot: new Types.ObjectId(dto.slotId),
//       status: { $ne: "rejected" },
//     });
//     if (exists) throw new BadRequestException("You already have a booking for this slot");

//     const booking = await this.bookingModel.create({
//       user: new Types.ObjectId(userId),
//       slot: new Types.ObjectId(dto.slotId),
//       notes: dto.notes,
//     });

//     return booking.populate(["user", "slot"]);
//   }

//   async getBookings(filter: { status?: string } = {}) {
//     const query: any = {};
//     if (filter.status) query.status = filter.status;
//     return this.bookingModel
//       .find(query)
//       .populate("user", "name email")
//       .populate("slot")
//       .sort("-createdAt");
//   }

//   async getUserBookings(userId: string) {
//     return this.bookingModel
//       .find({ user: new Types.ObjectId(userId) })
//       .populate("slot")
//       .sort("-createdAt");
//   }

//   async approveBooking(id: string, consultationFee: number) {
//     const booking = await this.bookingModel.findById(id).populate<{ user: UserDocument }>("user").populate("slot");
//     if (!booking) throw new NotFoundException("Booking not found");

//     booking.status = "approved";
//     booking.consultationFee = consultationFee;
//     booking.approvedAt = new Date();
//     await booking.save();

//     // Mark slot unavailable
//     await this.slotModel.findByIdAndUpdate(booking.slot, { available: false });

//     // Send email to user with fee quote
//     const user = booking.user as UserDocument;
//     const slot = booking.slot as TimeSlotDocument;
//     await this.emailService.sendBookingApproved(
//       user.email, user.name, slot, consultationFee
//     );

//     return booking;
//   }

//   async rejectBooking(id: string, reason: string) {
//     const booking = await this.bookingModel
//       .findByIdAndUpdate(id, { status: "rejected", rejectionReason: reason }, { new: true })
//       .populate<{ user: UserDocument }>("user")
//       .populate("slot");

//     if (!booking) throw new NotFoundException("Booking not found");

//     const user = booking.user as UserDocument;
//     await this.emailService.sendBookingRejected(user.email, user.name, reason);

//     return booking;
//   }

//   async deleteBooking(id: string) {
//     return this.bookingModel.findByIdAndDelete(id);
//   }
// }




import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Booking, BookingDocument,
  TimeSlot, TimeSlotDocument,
} from "./schemas/booking.schema";
import { EmailService } from "../email/email.service";
import { User, UserDocument } from "../users/schemas/user.schema";

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(TimeSlot.name) private slotModel: Model<TimeSlotDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService
  ) {}

  // ─── Slots ──────────────────────────────────────────────────────────────────
  async getAvailableSlots() {
    return this.slotModel.find({ available: true, date: { $gte: new Date() } }).sort("date startTime");
  }

  async createSlot(dto: any) {
    return this.slotModel.create(dto);
  }

  async deleteSlot(id: string) {
    return this.slotModel.findByIdAndDelete(id);
  }

  // ─── Bookings ────────────────────────────────────────────────────────────────
  async createBooking(userId: string, dto: { slotId: string; notes?: string }) {
    const slot = await this.slotModel.findById(dto.slotId);
    if (!slot || !slot.available) throw new BadRequestException("Slot is not available");

    // Check if user already has a pending booking for this slot
    const exists = await this.bookingModel.findOne({
      user: new Types.ObjectId(userId),
      slot: new Types.ObjectId(dto.slotId),
      status: { $ne: "rejected" },
    });
    if (exists) throw new BadRequestException("You already have a booking for this slot");

    const booking = await this.bookingModel.create({
      user: new Types.ObjectId(userId),
      slot: new Types.ObjectId(dto.slotId),
      notes: dto.notes,
    });

    return booking.populate(["user", "slot"]);
  }

  async getBookings(filter: { status?: string } = {}) {
    const query: any = {};
    if (filter.status) query.status = filter.status;
    return this.bookingModel
      .find(query)
      .populate("user", "name email")
      .populate("slot")
      .sort("-createdAt");
  }

  async getUserBookings(userId: string) {
    return this.bookingModel
      .find({ user: new Types.ObjectId(userId) })
      .populate("slot")
      .sort("-createdAt");
  }

  async approveBooking(id: string, consultationFee: number) {
    const booking = await this.bookingModel
      .findById(id)
      .populate<{ user: UserDocument }>("user")
      .populate<{ slot: TimeSlotDocument }>("slot");

    if (!booking) throw new NotFoundException("Booking not found");

    booking.status = "approved";
    booking.consultationFee = consultationFee;
    booking.approvedAt = new Date();
    await booking.save();

    // Mark slot unavailable
    await this.slotModel.findByIdAndUpdate((booking.slot as any)._id, { available: false });

    // Send email to user with fee quote
    const user = booking.user as unknown as UserDocument;
    const slot = booking.slot as unknown as TimeSlotDocument;
    await this.emailService.sendBookingApproved(
      user.email, user.name, slot, consultationFee
    );

    return booking;
  }

  async rejectBooking(id: string, reason: string) {
    const booking = await this.bookingModel
      .findByIdAndUpdate(id, { status: "rejected", rejectionReason: reason }, { new: true })
      .populate<{ user: UserDocument }>("user")
      .populate<{ slot: TimeSlotDocument }>("slot");

    if (!booking) throw new NotFoundException("Booking not found");

    const user = booking.user as unknown as UserDocument;
    await this.emailService.sendBookingRejected(user.email, user.name, reason);

    return booking;
  }

  async deleteBooking(id: string) {
    return this.bookingModel.findByIdAndDelete(id);
  }
}