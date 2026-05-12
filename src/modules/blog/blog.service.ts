import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BlogPost, BlogPostDocument } from "./schemas/blog.schema";

@Injectable()
export class BlogService {
  constructor(@InjectModel(BlogPost.name) private model: Model<BlogPostDocument>) {}

  async findAll(limit = 20, skip = 0) {
    const [posts, total] = await Promise.all([
      this.model.find().populate("author", "name").sort("-publishedAt").skip(skip).limit(limit),
      this.model.countDocuments(),
    ]);
    return { posts, total };
  }

  async findOne(id: string) {
    const post = await this.model.findById(id).populate("author", "name");
    if (!post) throw new NotFoundException("Post not found");
    return post;
  }

  async create(dto: any, authorId: string) {
    return this.model.create({ ...dto, author: authorId, publishedAt: new Date() });
  }

  async remove(id: string) {
    return this.model.findByIdAndDelete(id);
  }
}
