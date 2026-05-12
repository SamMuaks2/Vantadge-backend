import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type BlogPostDocument = HydratedDocument<BlogPost>;

@Schema({ timestamps: true })
export class BlogPost {
  @Prop({ required: true, enum: ["article", "youtube"] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  content?: string;

  @Prop()
  youtubeUrl?: string;

  @Prop()
  thumbnail?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: "AdminUser" })
  author: Types.ObjectId;

  @Prop({ default: Date.now })
  publishedAt: Date;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);
