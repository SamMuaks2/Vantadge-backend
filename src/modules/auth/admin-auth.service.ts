// import { Injectable, UnauthorizedException } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { JwtService } from "@nestjs/jwt";
// import { Model } from "mongoose";
// import * as bcrypt from "bcryptjs";
// import { AdminUser, AdminUserDocument } from "../admin/schemas/admin-user.schema";

// @Injectable()
// export class AdminAuthService {
//   constructor(
//     @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>,
//     private jwtService: JwtService
//   ) {}

//   async login(email: string, password: string) {
//     const user = await this.adminUserModel
//       .findOne({ email: email.toLowerCase() })
//       .select("+password");

//     if (!user) throw new UnauthorizedException("Invalid credentials");
//     if (user.suspended) throw new UnauthorizedException("Account suspended");

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid) throw new UnauthorizedException("Invalid credentials");

//     // Update lastLogin
//     await this.adminUserModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

//     const payload = {
//       sub: user._id,
//       email: user.email,
//       adminRole: user.adminRole,
//       role: user.adminRole, // for RolesGuard compatibility
//     };

//     return {
//       accessToken: this.jwtService.sign(payload),
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         adminRole: user.adminRole,
//       },
//     };
//   }

//   async changeOwnPassword(adminId: string, currentPassword: string, newPassword: string) {
//     const user = await this.adminUserModel.findById(adminId).select("+password");
//     if (!user) throw new UnauthorizedException();

//     const valid = await bcrypt.compare(currentPassword, user.password);
//     if (!valid) throw new UnauthorizedException("Current password is incorrect");

//     user.password = await bcrypt.hash(newPassword, 12);
//     await user.save();
//     return { message: "Password updated" };
//   }
// }




import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { Model } from "mongoose";
import * as bcrypt from "bcryptjs";
import { AdminUser, AdminUserDocument } from "../admin/schemas/admin-user.schema";

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>,
    private jwtService: JwtService
  ) {}

  async login(email: string, password: string) {
    const normalised = email.toLowerCase().trim();
    this.logger.log(`Login attempt: ${normalised}`);

    const user = await this.adminUserModel
      .findOne({ email: normalised })
      .select("+password");

    if (!user) {
      // Log all existing admin emails so mismatches are obvious in the terminal
      const all = await this.adminUserModel.find().select("email adminRole");
      this.logger.warn(
        `User not found. Existing admin emails: [${all.map((u) => u.email).join(", ")}]`
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.suspended) {
      throw new UnauthorizedException("Account suspended");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      this.logger.warn(`Wrong password for ${normalised}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.adminUserModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const payload = {
      sub: user._id,
      email: user.email,
      adminRole: user.adminRole,
      role: user.adminRole,
    };

    this.logger.log(`Login success: ${normalised} (${user.adminRole})`);

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        adminRole: user.adminRole,
      },
    };
  }

  async changeOwnPassword(adminId: string, currentPassword: string, newPassword: string) {
    const user = await this.adminUserModel.findById(adminId).select("+password");
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException("Current password is incorrect");

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return { message: "Password updated" };
  }
}