import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { ProgramsModule } from "./modules/programs/programs.module";
import { TestimonialsModule } from "./modules/testimonials/testimonials.module";
import { BlogModule } from "./modules/blog/blog.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { EmailModule } from "./modules/email/email.module";
import { AdminModule } from "./modules/admin/admin.module";
import { ContactModule } from "./modules/contact/contact.module";

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
        dbName: configService.get<string>("MONGODB_DB_NAME") || "vantadge",
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 5 },
      { name: "medium", ttl: 10000, limit: 20 },
      { name: "long", ttl: 60000, limit: 100 },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    BookingsModule,
    ProgramsModule,
    TestimonialsModule,
    BlogModule,
    SubscriptionsModule,
    EmailModule,
    AdminModule,
    ContactModule,
  ],
})
export class AppModule {}
