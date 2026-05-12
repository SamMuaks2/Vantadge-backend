import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Program", required: true })
  program: Types.ObjectId;

  @Prop({
    default: "pending_payment",
    enum: ["pending_payment", "payment_received", "active", "expired", "cancelled"],
  })
  status: string;

  @Prop()
  paymentMethod?: string;

  @Prop()
  paymentReference?: string;

  @Prop()
  stripePaymentIntentId?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  schedule?: string;

  @Prop()
  confirmedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
