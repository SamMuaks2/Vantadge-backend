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
//     return this.slotModel
//       .find({ available: true, date: { $gte: new Date() } })
//       .sort("date startTime");
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

//     // Prevent duplicate pending/approved booking for same slot by same user
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

//     // Populate so the response includes user + slot details
//     return booking.populate(["user", "slot"]);
//   }

//   async getBookings(filter: { status?: string; limit?: number } = {}) {
//     const query: any = {};
//     // Only apply status filter when a non-empty value is passed
//     if (filter.status && filter.status.trim() !== "") {
//       query.status = filter.status;
//     }

//     let q = this.bookingModel
//       .find(query)
//       .populate("user", "name email")
//       .populate("slot")
//       .sort("-createdAt");

//     if (filter.limit && filter.limit > 0) {
//       q = q.limit(filter.limit) as any;
//     }

//     return q.exec();
//   }

//   async getUserBookings(userId: string) {
//     return this.bookingModel
//       .find({ user: new Types.ObjectId(userId) })
//       .populate("slot")
//       .sort("-createdAt");
//   }

//   async approveBooking(id: string, consultationFee: number) {
//     const booking = await this.bookingModel
//       .findById(id)
//       .populate<{ user: UserDocument }>("user")
//       .populate<{ slot: TimeSlotDocument }>("slot");

//     if (!booking) throw new NotFoundException("Booking not found");

//     booking.status = "approved";
//     booking.consultationFee = consultationFee;
//     booking.approvedAt = new Date();
//     await booking.save();

//     // Mark slot unavailable so no one else can book it
//     await this.slotModel.findByIdAndUpdate((booking.slot as any)._id, { available: false });

//     const user = booking.user as unknown as UserDocument;
//     const slot = booking.slot as unknown as TimeSlotDocument;
//     await this.emailService.sendBookingApproved(
//       user.email, user.name, slot, consultationFee
//     );

//     return booking;
//   }

//   async rejectBooking(id: string, reason: string) {
//     const booking = await this.bookingModel
//       .findByIdAndUpdate(id, { status: "rejected", rejectionReason: reason }, { new: true })
//       .populate<{ user: UserDocument }>("user")
//       .populate<{ slot: TimeSlotDocument }>("slot");

//     if (!booking) throw new NotFoundException("Booking not found");

//     const user = booking.user as unknown as UserDocument;
//     await this.emailService.sendBookingRejected(user.email, user.name, reason);

//     return booking;
//   }

//   async deleteBooking(id: string) {
//     return this.bookingModel.findByIdAndDelete(id);
//   }
// }




import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
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
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(TimeSlot.name) private slotModel: Model<TimeSlotDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) {}

  // ─── Slots ──────────────────────────────────────────────────────────────────

  async getAvailableSlots() {
    return this.slotModel
      .find({ available: true, date: { $gte: new Date() } })
      .sort("date startTime");
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
    if (!slot || !slot.available) {
      throw new BadRequestException("Slot is not available");
    }

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

  async getBookings(filter: { status?: string; limit?: number } = {}) {
    const query: any = {};
    if (filter.status && filter.status.trim() !== "") {
      query.status = filter.status;
    }

    let q = this.bookingModel
      .find(query)
      .populate("user", "name email")
      .populate("slot")
      .sort("-createdAt");

    if (filter.limit && filter.limit > 0) {
      q = q.limit(filter.limit) as any;
    }

    return q.exec();
  }

  async getUserBookings(userId: string) {
    return this.bookingModel
      .find({ user: new Types.ObjectId(userId) })
      .populate("slot")
      .sort("-createdAt");
  }

  // ─── Approve ─────────────────────────────────────────────────────────────────
  // KEY FIX: use findByIdAndUpdate (no .save()), then do a SEPARATE populated
  // fetch just for reading user/slot data to send the email.
  // Never call .save() on a document that has been .populate()'d — Mongoose
  // will attempt to persist the sub-documents as nested objects and throw a
  // CastError / 500.
  async approveBooking(id: string, consultationFee: number) {
    // 1. Write the update atomically — no populate here
    const updated = await this.bookingModel.findByIdAndUpdate(
      id,
      {
        status: "approved",
        consultationFee,
        approvedAt: new Date(),
      },
      { new: true },
    );

    if (!updated) throw new NotFoundException("Booking not found");

    // 2. Mark the slot unavailable
    await this.slotModel.findByIdAndUpdate(updated.slot, { available: false });

    // 3. Fetch populated data ONLY for sending the email (separate query, never saved)
    const populated = await this.bookingModel
      .findById(id)
      .populate<{ user: UserDocument }>("user", "name email")
      .populate<{ slot: TimeSlotDocument }>("slot")
      .lean();  // .lean() returns a plain JS object — can never be .save()'d accidentally

    if (populated) {
      const user = populated.user as unknown as UserDocument;
      const slot = populated.slot as unknown as TimeSlotDocument;
      try {
        await this.emailService.sendBookingApproved(
          user.email, user.name, slot, consultationFee,
        );
      } catch (err) {
        // Log but don't fail the request if email errors
        this.logger.error(`Failed to send approval email: ${err.message}`);
      }
    }

    // 4. Return the updated doc with populated fields for the API response
    return this.bookingModel
      .findById(id)
      .populate("user", "name email")
      .populate("slot");
  }

  // ─── Reject ──────────────────────────────────────────────────────────────────
  async rejectBooking(id: string, reason: string) {
    // 1. Write atomically — no populate
    const updated = await this.bookingModel.findByIdAndUpdate(
      id,
      { status: "rejected", rejectionReason: reason },
      { new: true },
    );

    if (!updated) throw new NotFoundException("Booking not found");

    // 2. Fetch user for email — separate query, lean
    const populated = await this.bookingModel
      .findById(id)
      .populate<{ user: UserDocument }>("user", "name email")
      .lean();

    if (populated) {
      const user = populated.user as unknown as UserDocument;
      try {
        await this.emailService.sendBookingRejected(user.email, user.name, reason);
      } catch (err) {
        this.logger.error(`Failed to send rejection email: ${err.message}`);
      }
    }

    // 3. Return populated doc for the API response
    return this.bookingModel
      .findById(id)
      .populate("user", "name email")
      .populate("slot");
  }

  async deleteBooking(id: string) {
    return this.bookingModel.findByIdAndDelete(id);
  }
}