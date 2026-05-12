import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type TestimonialDocument = HydratedDocument<Testimonial>;

@Schema({ timestamps: true })
export class Testimonial {
  @Prop({ type: Types.ObjectId, ref: "User" })
  user?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  age?: number;

  @Prop()
  program?: string;

  @Prop({ required: true })
  content: string;

  @Prop({ min: 1, max: 5, default: 5 })
  rating: number;

  @Prop()
  avatarInitials?: string;

  @Prop({ default: "pending", enum: ["pending", "approved", "rejected"] })
  status: string;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);
