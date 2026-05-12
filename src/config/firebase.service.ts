import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get("FIREBASE_PROJECT_ID"),
          clientEmail: this.configService.get("FIREBASE_CLIENT_EMAIL"),
          privateKey: this.configService
            .get("FIREBASE_PRIVATE_KEY")
            ?.replace(/\\n/g, "\n"),
        }),
      });
      this.logger.log("Firebase Admin initialised");
    } else {
      this.app = admin.app();
    }
  }

  get auth(): admin.auth.Auth {
    return admin.auth(this.app);
  }

  /** Create a Firebase user (admin panel users) */
  async createUser(params: { email: string; password: string; displayName: string }): Promise<string> {
    const user = await this.auth.createUser({
      email: params.email,
      password: params.password,
      displayName: params.displayName,
    });
    return user.uid;
  }

  /** Update Firebase user password */
  async updatePassword(firebaseUid: string, newPassword: string): Promise<void> {
    await this.auth.updateUser(firebaseUid, { password: newPassword });
  }

  /** Disable / enable Firebase user (suspension) */
  async setDisabled(firebaseUid: string, disabled: boolean): Promise<void> {
    await this.auth.updateUser(firebaseUid, { disabled });
  }

  /** Delete Firebase user */
  async deleteUser(firebaseUid: string): Promise<void> {
    await this.auth.deleteUser(firebaseUid);
  }

  /** Set custom claims (role) */
  async setRole(firebaseUid: string, role: string): Promise<void> {
    await this.auth.setCustomUserClaims(firebaseUid, { adminRole: role });
  }

  /** Verify Firebase ID token */
  async verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return this.auth.verifyIdToken(idToken);
  }
}
