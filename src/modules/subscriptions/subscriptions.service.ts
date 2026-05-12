// import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { ConfigService } from "@nestjs/config";
// import { Model, Types } from "mongoose";
// import Stripe from "stripe";
// import { Subscription, SubscriptionDocument } from "./schemas/subscription.schema";
// import { User, UserDocument } from "../users/schemas/user.schema";
// import { Program, ProgramDocument } from "../programs/schemas/program.schema";
// import { EmailService } from "../email/email.service";

// @Injectable()
// export class SubscriptionsService {
//   private stripe: Stripe;

//   constructor(
//     @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//     @InjectModel(Program.name) private programModel: Model<ProgramDocument>,
//     private emailService: EmailService,
//     private configService: ConfigService
//   ) {
//     this.stripe = new Stripe(this.configService.get("STRIPE_SECRET_KEY") || "", {
//       apiVersion: "2024-04-10",
//     });
//   }

//   async createPaymentIntent(userId: string, programId: string) {
//     const program = await this.programModel.findById(programId);
//     if (!program) throw new NotFoundException("Programme not found");

//     const existing = await this.subscriptionModel.findOne({
//       user: new Types.ObjectId(userId),
//       status: "active",
//     });
//     if (existing) throw new BadRequestException("You already have an active subscription");

//     const paymentIntent = await this.stripe.paymentIntents.create({
//       amount: program.price * 100, // pence
//       currency: "gbp",
//       metadata: { userId, programId },
//     });

//     return { clientSecret: paymentIntent.client_secret };
//   }

//   async handleStripeWebhook(payload: Buffer, signature: string) {
//     const webhookSecret = this.configService.get("STRIPE_WEBHOOK_SECRET");
//     let event: Stripe.Event;

//     try {
//       event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
//     } catch {
//       throw new BadRequestException("Invalid webhook signature");
//     }

//     if (event.type === "payment_intent.succeeded") {
//       const pi = event.data.object as Stripe.PaymentIntent;
//       const { userId, programId } = pi.metadata;

//       await this.subscriptionModel.findOneAndUpdate(
//         { user: new Types.ObjectId(userId), program: new Types.ObjectId(programId) },
//         {
//           status: "payment_received",
//           stripePaymentIntentId: pi.id,
//           paymentMethod: "stripe",
//         },
//         { upsert: true, new: true }
//       );
//     }
//   }

//   async getMySubscription(userId: string) {
//     return this.subscriptionModel
//       .findOne({ user: new Types.ObjectId(userId) })
//       .populate("program")
//       .sort("-createdAt");
//   }

//   async getAllSubscriptions(status?: string) {
//     const query: any = {};
//     if (status) query.status = status;
//     return this.subscriptionModel
//       .find(query)
//       .populate("user", "name email")
//       .populate("program", "title duration price")
//       .sort("-createdAt");
//   }

//   async confirmPayment(id: string) {
//     const sub = await this.subscriptionModel
//       .findByIdAndUpdate(id, { status: "active", confirmedAt: new Date() }, { new: true })
//       .populate<{ user: UserDocument }>("user")
//       .populate<{ program: ProgramDocument }>("program");

//     if (!sub) throw new NotFoundException("Subscription not found");

//     await this.userModel.findByIdAndUpdate(sub.user._id, {
//       subscriptionStatus: "active",
//       activeProgram: {
//         programId: sub.program._id,
//         title: sub.program.title,
//         startDate: new Date(),
//       },
//     });

//     return sub;
//   }

//   async notifyMember(id: string, message: string) {
//     const sub = await this.subscriptionModel
//       .findById(id)
//       .populate<{ user: UserDocument }>("user")
//       .populate<{ program: ProgramDocument }>("program");

//     if (!sub) throw new NotFoundException("Subscription not found");

//     await this.emailService.sendSubscriptionPaymentPending(
//       sub.user.email,
//       sub.user.name,
//       sub.program.title,
//       message
//     );

//     return { message: "Notification sent" };
//   }

//   async sendSchedule(id: string, schedule: string) {
//     const sub = await this.subscriptionModel
//       .findByIdAndUpdate(id, { schedule }, { new: true })
//       .populate<{ user: UserDocument }>("user")
//       .populate<{ program: ProgramDocument }>("program");

//     if (!sub) throw new NotFoundException("Subscription not found");

//     await this.emailService.sendTrainingSchedule(
//       sub.user.email,
//       sub.user.name,
//       sub.program.title,
//       schedule
//     );

//     return sub;
//   }
// }




import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model, Types } from "mongoose";
import Stripe from "stripe";
import { Subscription, SubscriptionDocument } from "./schemas/subscription.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { Program, ProgramDocument } from "../programs/schemas/program.schema";
import { EmailService } from "../email/email.service";

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Program.name) private programModel: Model<ProgramDocument>,
    private emailService: EmailService,
    private configService: ConfigService
  ) {
    this.stripe = new Stripe(this.configService.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-04-10",
    });
  }

  async createPaymentIntent(userId: string, programId: string) {
    const program = await this.programModel.findById(programId);
    if (!program) throw new NotFoundException("Programme not found");

    const existing = await this.subscriptionModel.findOne({
      user: new Types.ObjectId(userId),
      status: "active",
    });
    if (existing) throw new BadRequestException("You already have an active subscription");

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: program.price * 100, // pence
      currency: "gbp",
      metadata: { userId, programId },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new BadRequestException("Invalid webhook signature");
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const { userId, programId } = pi.metadata;

      await this.subscriptionModel.findOneAndUpdate(
        { user: new Types.ObjectId(userId), program: new Types.ObjectId(programId) },
        {
          status: "payment_received",
          stripePaymentIntentId: pi.id,
          paymentMethod: "stripe",
        },
        { upsert: true, new: true }
      );
    }
  }

  async getMySubscription(userId: string) {
    return this.subscriptionModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate("program")
      .sort("-createdAt");
  }

  async getAllSubscriptions(status?: string) {
    const query: any = {};
    if (status) query.status = status;
    return this.subscriptionModel
      .find(query)
      .populate("user", "name email")
      .populate("program", "title duration price")
      .sort("-createdAt");
  }

  async confirmPayment(id: string) {
    const sub = await this.subscriptionModel
      .findByIdAndUpdate(id, { status: "active", confirmedAt: new Date() }, { new: true })
      .populate<{ user: UserDocument }>("user")
      .populate<{ program: ProgramDocument }>("program");

    if (!sub) throw new NotFoundException("Subscription not found");

    const user = sub.user as unknown as UserDocument;
    const program = sub.program as unknown as ProgramDocument;

    await this.userModel.findByIdAndUpdate(user._id, {
      subscriptionStatus: "active",
      activeProgram: {
        programId: program._id,
        title: program.title,
        startDate: new Date(),
      },
    });

    return sub;
  }

  async notifyMember(id: string, message: string) {
    const sub = await this.subscriptionModel
      .findById(id)
      .populate<{ user: UserDocument }>("user")
      .populate<{ program: ProgramDocument }>("program");

    if (!sub) throw new NotFoundException("Subscription not found");

    const user = sub.user as unknown as UserDocument;
    const program = sub.program as unknown as ProgramDocument;

    await this.emailService.sendSubscriptionPaymentPending(
      user.email,
      user.name,
      program.title,
      message
    );

    return { message: "Notification sent" };
  }

  async sendSchedule(id: string, schedule: string) {
    const sub = await this.subscriptionModel
      .findByIdAndUpdate(id, { schedule }, { new: true })
      .populate<{ user: UserDocument }>("user")
      .populate<{ program: ProgramDocument }>("program");

    if (!sub) throw new NotFoundException("Subscription not found");

    const user = sub.user as unknown as UserDocument;
    const program = sub.program as unknown as ProgramDocument;

    await this.emailService.sendTrainingSchedule(
      user.email,
      user.name,
      program.title,
      schedule
    );

    return sub;
  }
}