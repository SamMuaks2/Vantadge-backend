import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AdminUserDocument = HydratedDocument<AdminUser>;

export type AdminRole = "admin" | "finance" | "pa" | "trainer" | "communications";

@Schema({ timestamps: true })
export class AdminUser {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({
    required: true,
    enum: ["admin", "finance", "pa", "trainer", "communications"],
  })
  adminRole: AdminRole;

  @Prop({ default: false })
  suspended: boolean;

  @Prop()
  firebaseUid?: string;

  @Prop()
  lastLogin?: Date;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
