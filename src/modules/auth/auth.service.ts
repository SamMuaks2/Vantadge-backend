// import {
//   Injectable,
//   UnauthorizedException,
//   ConflictException,
//   BadRequestException,
// } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { JwtService } from "@nestjs/jwt";
// import { Model } from "mongoose";
// import * as bcrypt from "bcryptjs";
// import { User, UserDocument } from "../users/schemas/user.schema";
// import { RegisterDto } from "./dto/register.dto";
// import { GoogleAuthDto } from "./dto/google-auth.dto";
// import { EmailService } from "../email/email.service";

// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//     private jwtService: JwtService,
//     private emailService: EmailService
//   ) {}

//   async validateUser(email: string, password: string): Promise<UserDocument | null> {
//     const user = await this.userModel.findOne({ email: email.toLowerCase() }).select("+password");
//     if (!user || !user.password) return null;
//     const valid = await bcrypt.compare(password, user.password);
//     return valid ? user : null;
//   }

//   async register(dto: RegisterDto) {
//     const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
//     if (existing) throw new ConflictException("Email already registered");

//     const hashedPassword = await bcrypt.hash(dto.password, 12);
//     const user = await this.userModel.create({
//       name: dto.name,
//       email: dto.email.toLowerCase(),
//       phone: dto.phone,
//       password: hashedPassword,
//       role: "member",
//     });

//     // Welcome email
//     await this.emailService.sendWelcome(user.email, user.name);

//     return this.generateTokenResponse(user);
//   }

//   async login(user: UserDocument) {
//     await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });
//     return this.generateTokenResponse(user);
//   }

//   async googleAuth(dto: GoogleAuthDto) {
//     let user = await this.userModel.findOne({
//       $or: [{ googleId: dto.googleId }, { email: dto.email.toLowerCase() }],
//     });

//     if (!user) {
//       user = await this.userModel.create({
//         googleId: dto.googleId,
//         email: dto.email.toLowerCase(),
//         name: dto.name,
//         avatar: dto.avatar,
//         role: "member",
//         emailVerified: true,
//       });
//       await this.emailService.sendWelcome(user.email, user.name);
//     } else if (!user.googleId) {
//       user.googleId = dto.googleId;
//       user.avatar = dto.avatar;
//       await user.save();
//     }

//     await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });
//     return this.generateTokenResponse(user);
//   }

//   async forgotPassword(email: string) {
//     const user = await this.userModel.findOne({ email: email.toLowerCase() });
//     // Always return success to avoid email enumeration
//     if (!user) return { message: "If this email exists, a reset link has been sent" };

//     const resetToken = this.jwtService.sign(
//       { sub: user._id, purpose: "password-reset" },
//       { expiresIn: "1h" }
//     );

//     await this.emailService.sendPasswordReset(user.email, user.name, resetToken);
//     return { message: "If this email exists, a reset link has been sent" };
//   }

//   async resetPassword(token: string, newPassword: string) {
//     let payload: any;
//     try {
//       payload = this.jwtService.verify(token);
//     } catch {
//       throw new BadRequestException("Invalid or expired reset token");
//     }
//     if (payload.purpose !== "password-reset") throw new BadRequestException("Invalid token");

//     const hashed = await bcrypt.hash(newPassword, 12);
//     await this.userModel.findByIdAndUpdate(payload.sub, { password: hashed });
//     return { message: "Password updated successfully" };
//   }

//   private generateTokenResponse(user: UserDocument) {
//     const payload = { sub: user._id, email: user.email, role: user.role };
//     return {
//       accessToken: this.jwtService.sign(payload),
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         avatar: user.avatar,
//         role: user.role,
//       },
//     };
//   }
// }




import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { Model } from "mongoose";
import * as bcrypt from "bcryptjs";
import { User, UserDocument } from "../users/schemas/user.schema";
import { RegisterDto } from "./dto/register.dto";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { EmailService } from "../email/email.service";
import { FirebaseService } from "../../config/firebase.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private firebaseService: FirebaseService,
  ) {}

  async resetPasswordByEmail(email: string, newPassword: string) {
  const user = await this.userModel.findOne({ email: email.toLowerCase() });
 
  // Always return 200 — don't reveal whether the email exists
  if (!user) {
    return { message: "Password sync complete" };
  }
 
  const hashed = await bcrypt.hash(newPassword, 12);
  await this.userModel.findByIdAndUpdate(user._id, { password: hashed });
 
  this.logger.log(`MongoDB password synced after Firebase reset for: ${email}`);
  return { message: "Password sync complete" };
}

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !user.password) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async login(user: UserDocument) {
    await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    return this.generateTokenResponse(user);
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException("Email already registered");

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      password: hashedPassword,
      role: "member",
    });

    // Sync to Firebase for account recovery
    try {
      const firebaseUid = await this.firebaseService.createUser({
        email: user.email,
        password: dto.password, // plain password — Firebase hashes it
        displayName: user.name,
      });
      await this.userModel.findByIdAndUpdate(user._id, { firebaseUid });
      this.logger.log(`Firebase user created for member: ${user.email}`);
    } catch (err) {
      // Don't fail registration if Firebase sync fails
      this.logger.error(`Firebase sync failed for ${user.email}: ${err.message}`);
    }

    await this.emailService.sendWelcome(user.email, user.name);
    return this.generateTokenResponse(user);
  }

  async googleAuth(dto: GoogleAuthDto) {
    let user = await this.userModel.findOne({
      $or: [{ googleId: dto.googleId }, { email: dto.email.toLowerCase() }],
    });

    if (!user) {
      user = await this.userModel.create({
        googleId: dto.googleId,
        email: dto.email.toLowerCase(),
        name: dto.name,
        avatar: dto.avatar,
        role: "member",
        emailVerified: true,
      });

      // Sync to Firebase — Google users get a random password since they use OAuth
      try {
        const firebaseUid = await this.firebaseService.createUser({
          email: user.email,
          password: this.generateTempPassword(), // random — they'll use Google or reset flow
          displayName: user.name,
        });
        await this.userModel.findByIdAndUpdate(user._id, { firebaseUid });
        this.logger.log(`Firebase user created for Google member: ${user.email}`);
      } catch (err) {
        this.logger.error(`Firebase sync failed for ${user.email}: ${err.message}`);
      }

      await this.emailService.sendWelcome(user.email, user.name);
    } else {
      // Existing user — create Firebase entry if missing (backfill)
      if (!user.firebaseUid) {
        try {
          const firebaseUid = await this.firebaseService.createUser({
            email: user.email,
            password: this.generateTempPassword(),
            displayName: user.name,
          });
          await this.userModel.findByIdAndUpdate(user._id, { firebaseUid });
          this.logger.log(`Firebase backfilled for existing member: ${user.email}`);
        } catch (err) {
          this.logger.error(`Firebase backfill failed for ${user.email}: ${err.message}`);
        }
      }

      if (!user.googleId) {
        user.googleId = dto.googleId;
        user.avatar = dto.avatar;
        await user.save();
      }
    }

    await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    return this.generateTokenResponse(user);
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) return { message: "If this email exists, a reset link has been sent" };

    const resetToken = this.jwtService.sign(
      { sub: user._id, purpose: "password-reset" },
      { expiresIn: "1h" }
    );

    await this.emailService.sendPasswordReset(user.email, user.name, resetToken);
    return { message: "If this email exists, a reset link has been sent" };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException("Invalid or expired reset token");
    }
    if (payload.purpose !== "password-reset") throw new BadRequestException("Invalid token");

    const hashed = await bcrypt.hash(newPassword, 12);
    const user = await this.userModel.findByIdAndUpdate(
      payload.sub,
      { password: hashed },
      { new: true }
    );

    // Keep Firebase password in sync
    if (user?.firebaseUid) {
      try {
        await this.firebaseService.updatePassword(user.firebaseUid, newPassword);
      } catch (err) {
        this.logger.error(`Firebase password sync failed for ${user.email}: ${err.message}`);
      }
    }

    return { message: "Password updated successfully" };
  }

  private generateTempPassword(): string {
    // Cryptographically random enough for a Firebase placeholder
    return Math.random().toString(36).slice(-10) +
           Math.random().toString(36).slice(-10).toUpperCase() +
           "!1";
  }

  private generateTokenResponse(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }
}