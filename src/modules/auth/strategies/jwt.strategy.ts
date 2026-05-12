// import { Injectable, UnauthorizedException } from "@nestjs/common";
// import { PassportStrategy } from "@nestjs/passport";
// import { ExtractJwt, Strategy } from "passport-jwt";
// import { ConfigService } from "@nestjs/config";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model } from "mongoose";
// import { User, UserDocument } from "../../users/schemas/user.schema";
// import { AdminUser, AdminUserDocument } from "../../modules/admin/schemas/admin-user.schema";

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     private configService: ConfigService,
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//     @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: configService.get("JWT_SECRET"),
//     });
//   }

//   async validate(payload: any) {
//     // Admin panel users have adminRole in their JWT
//     if (payload.adminRole) {
//       const admin = await this.adminUserModel
//         .findById(payload.sub)
//         .select("-password");
//       if (!admin || admin.suspended) throw new UnauthorizedException();
//       return admin;
//     }
//     // Regular member
//     const user = await this.userModel.findById(payload.sub).select("-password");
//     if (!user) throw new UnauthorizedException();
//     return user;
//   }
// }



import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../../users/schemas/user.schema";
import { AdminUser, AdminUserDocument } from "../../admin/schemas/admin-user.schema";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUserDocument>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET"),
    });
  }

  async validate(payload: any) {
    // Admin panel users have adminRole in their JWT
    if (payload.adminRole) {
      const admin = await this.adminUserModel
        .findById(payload.sub)
        .select("-password");
      if (!admin || admin.suspended) throw new UnauthorizedException();
      return admin;
    }
    // Regular member
    const user = await this.userModel.findById(payload.sub).select("-password");
    if (!user) throw new UnauthorizedException();
    return user;
  }
}