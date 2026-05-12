import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Request, RawBodyRequest, Req, Headers
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { SubscriptionsService } from "./subscriptions.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Request as ExpressRequest } from "express";

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  // Stripe webhook (raw body)
  @Post("webhook")
  @ApiOperation({ summary: "Stripe webhook handler" })
  handleWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers("stripe-signature") sig: string
  ) {
    return this.subscriptionsService.handleStripeWebhook(req.rawBody!, sig);
  }

  // Create Stripe payment intent
  @Post("create-payment-intent")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Create Stripe payment intent for programme" })
  createPaymentIntent(@Request() req: any, @Body() body: { programId: string }) {
    return this.subscriptionsService.createPaymentIntent(req.user._id.toString(), body.programId);
  }

  // Member: get own subscription
  @Get("my")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Get my subscription" })
  getMySubscription(@Request() req: any) {
    return this.subscriptionsService.getMySubscription(req.user._id.toString());
  }

  // Admin: get all subscriptions
  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "finance", "pa")
  @ApiOperation({ summary: "Get all subscriptions (admin)" })
  getAllSubscriptions(@Query("status") status?: string) {
    return this.subscriptionsService.getAllSubscriptions(status);
  }

  // Admin: confirm payment
  @Patch(":id/confirm")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "finance")
  @ApiOperation({ summary: "Confirm payment & activate subscription" })
  confirmPayment(@Param("id") id: string) {
    return this.subscriptionsService.confirmPayment(id);
  }

  // Admin: notify member
  @Post(":id/notify")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "finance", "pa")
  @ApiOperation({ summary: "Send payment notification email to member" })
  notifyMember(@Param("id") id: string, @Body() body: { message: string }) {
    return this.subscriptionsService.notifyMember(id, body.message);
  }

  // Admin (trainer): send training schedule
  @Post(":id/schedule")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "trainer")
  @ApiOperation({ summary: "Send training schedule to member" })
  sendSchedule(@Param("id") id: string, @Body() body: { schedule: string }) {
    return this.subscriptionsService.sendSchedule(id, body.schedule);
  }
}
