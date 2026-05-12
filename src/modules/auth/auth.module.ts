import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { User, UserSchema } from "../users/schemas/user.schema";
import { AdminUser, AdminUserSchema } from "../admin/schemas/admin-user.schema";
import { EmailModule } from "../email/email.module";
import { FirebaseService } from "../../config/firebase.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: "7d" },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
    ]),
    EmailModule,
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, AdminAuthService, JwtStrategy, LocalStrategy, FirebaseService],
  exports: [AuthService, AdminAuthService, JwtModule],
})
export class AuthModule {}
