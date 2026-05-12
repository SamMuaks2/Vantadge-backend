import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { BookingsService } from "./bookings.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("bookings")
@Controller("bookings")
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // ─── Public: available slots ───────────────────────────────────────────────
  @Get("slots/available")
  @ApiOperation({ summary: "Get available time slots (public)" })
  getAvailableSlots() {
    return this.bookingsService.getAvailableSlots();
  }

  // ─── Admin: slot management ────────────────────────────────────────────────
  @Post("slots")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa", "trainer")
  @ApiOperation({ summary: "Create a time slot (admin)" })
  createSlot(@Body() body: any) {
    return this.bookingsService.createSlot(body);
  }

  @Delete("slots/:id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa")
  deleteSlot(@Param("id") id: string) {
    return this.bookingsService.deleteSlot(id);
  }

  // ─── Member: create booking ────────────────────────────────────────────────
  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Request a booking (member)" })
  createBooking(@Request() req: any, @Body() body: { slotId: string; notes?: string }) {
    return this.bookingsService.createBooking(req.user._id.toString(), body);
  }

  // ─── Member: get my bookings ───────────────────────────────────────────────
  @Get("my")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "Get current user's bookings" })
  getMyBookings(@Request() req: any) {
    return this.bookingsService.getUserBookings(req.user._id.toString());
  }

  // ─── Admin: get all bookings ───────────────────────────────────────────────
  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa", "trainer", "finance", "communications")
  @ApiOperation({ summary: "Get all bookings (admin)" })
  getBookings(@Query("status") status?: string) {
    return this.bookingsService.getBookings({ status });
  }

  // ─── Admin: approve ────────────────────────────────────────────────────────
  @Patch(":id/approve")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa", "trainer")
  @ApiOperation({ summary: "Approve booking & send fee quote email" })
  approveBooking(@Param("id") id: string, @Body() body: { consultationFee: number }) {
    return this.bookingsService.approveBooking(id, body.consultationFee);
  }

  // ─── Admin: reject ─────────────────────────────────────────────────────────
  @Patch(":id/reject")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin", "pa")
  @ApiOperation({ summary: "Reject booking & send email" })
  rejectBooking(@Param("id") id: string, @Body() body: { reason: string }) {
    return this.bookingsService.rejectBooking(id, body.reason);
  }

  // ─── Admin: delete ─────────────────────────────────────────────────────────
  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  deleteBooking(@Param("id") id: string) {
    return this.bookingsService.deleteBooking(id);
  }
}
