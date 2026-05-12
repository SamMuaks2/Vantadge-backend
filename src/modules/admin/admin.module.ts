import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminUser, AdminUserSchema } from "./schemas/admin-user.schema";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FirebaseService } from "../../config/firebase.service";
import { User, UserSchema } from "../users/schemas/user.schema";
import { Booking, BookingSchema } from "../bookings/schemas/booking.schema";
import { Subscription, SubscriptionSchema } from "../subscriptions/schemas/subscription.schema";
import { Testimonial, TestimonialSchema } from "../testimonials/schemas/testimonial.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Testimonial.name, schema: TestimonialSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, FirebaseService],
  exports: [AdminService],
})
export class AdminModule {}
