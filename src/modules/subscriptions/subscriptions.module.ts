import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Subscription, SubscriptionSchema } from "./schemas/subscription.schema";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { User, UserSchema } from "../users/schemas/user.schema";
import { Program, ProgramSchema } from "../programs/schemas/program.schema";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: User.name, schema: UserSchema },
      { name: Program.name, schema: ProgramSchema },
    ]),
    EmailModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [MongooseModule],
})
export class SubscriptionsModule {}
