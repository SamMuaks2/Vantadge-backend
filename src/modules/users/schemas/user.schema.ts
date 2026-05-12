import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ select: false })
  password?: string;

  @Prop()
  phone?: string;

  @Prop()
  googleId?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: "member", enum: ["member", "admin"] })
  role: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  lastLogin?: Date;

  // Subscription state
  @Prop({ default: "none", enum: ["none", "pending_payment", "active", "expired"] })
  subscriptionStatus: string;

  @Prop({ type: Object })
  activeProgram?: {
    programId: string;
    title: string;
    startDate: Date;
    endDate: Date;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
