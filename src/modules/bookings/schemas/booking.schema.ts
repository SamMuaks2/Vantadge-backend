import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

// --- Time Slot Schema ---
export type TimeSlotDocument = HydratedDocument<TimeSlot>;

@Schema({ timestamps: true })
export class TimeSlot {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ default: true })
  available: boolean;

  @Prop({ required: true })
  sessionType: string;

  @Prop({ default: 1 })
  maxBookings: number;
}

export const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);

// --- Booking Schema ---
export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "TimeSlot", required: true })
  slot: Types.ObjectId;

  @Prop({ default: "pending", enum: ["pending", "approved", "rejected"] })
  status: string;

  @Prop()
  notes?: string;

  @Prop()
  consultationFee?: number;

  @Prop()
  rejectionReason?: string;

  @Prop()
  approvedAt?: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
