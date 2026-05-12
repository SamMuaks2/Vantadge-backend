import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProgramDocument = HydratedDocument<Program>;

@Schema({ timestamps: true })
export class Program {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  longDescription?: string;

  @Prop({ required: true })
  duration: string; // e.g. "12 weeks"

  @Prop({ required: true })
  price: number; // in GBP

  @Prop({ default: "All Levels" })
  level: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  active: boolean;

  @Prop()
  thumbnail?: string;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);
