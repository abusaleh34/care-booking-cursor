import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1234567890000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1234567890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // User indexes
    await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "users" ("email")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_active_verified" ON "users" ("is_active", "is_verified")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_user_created_at" ON "users" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_last_login" ON "users" ("last_login_at")`);

    // Booking indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_status_date" ON "bookings" ("status", "scheduled_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_customer_status" ON "bookings" ("customer_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_provider_status" ON "bookings" ("provider_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_schedule" ON "bookings" ("scheduled_date", "scheduled_time")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_booking_created_at" ON "bookings" ("created_at")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_payment_status" ON "bookings" ("payment_status")`,
    );

    // Service Provider indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_provider_verified_active" ON "service_providers" ("is_verified", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_provider_rating" ON "service_providers" ("average_rating" DESC)`,
    );
    // Category index removed - column doesn't exist
    // Location index removed - columns don't exist

    // Service indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_service_provider_active" ON "services" ("provider_id", "is_active")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_service_category" ON "services" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_price" ON "services" ("price")`);

    // Review indexes
    await queryRunner.query(`CREATE INDEX "IDX_review_provider" ON "reviews" ("provider_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_review_booking" ON "reviews" ("booking_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_review_rating" ON "reviews" ("rating")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_review_created_at" ON "reviews" ("created_at" DESC)`,
    );

    // Provider Availability indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_availability_provider_day" ON "provider_availability" ("provider_id", "day_of_week")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_availability_active" ON "provider_availability" ("is_available")`,
    );

    // Admin indexes
    await queryRunner.query(`CREATE INDEX "IDX_admin_user_level" ON "admin_users" ("admin_level")`);
    await queryRunner.query(`CREATE INDEX "IDX_admin_active" ON "admin_users" ("is_active")`);

    // Dispute indexes
    await queryRunner.query(`CREATE INDEX "IDX_dispute_status" ON "disputes" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_dispute_type" ON "disputes" ("dispute_type")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_dispute_assigned" ON "disputes" ("assigned_admin_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dispute_created_at" ON "disputes" ("created_at" DESC)`,
    );

    // Audit Log indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_user_action" ON "audit_logs" ("user_id", "action")`,
    );
    // Resource index removed - columns don't exist
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_created_at" ON "audit_logs" ("created_at" DESC)`,
    );

    // Message indexes for real-time queries
    await queryRunner.query(
      `CREATE INDEX "IDX_message_conversation" ON "messages" ("conversation_id", "sent_at" DESC)`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_message_sender" ON "messages" ("sender_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_message_read" ON "messages" ("is_read")`);

    // Conversation indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_conversation_participants" ON "conversations" ("customer_id", "provider_id")`,
    );
    // Last message index removed - column doesn't exist

    // Add composite indexes for complex queries
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_date_status_provider" ON "bookings" ("scheduled_date", "status", "provider_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_email_active" ON "users" ("email", "is_active") WHERE "is_active" = true`,
    );

    // Add partial indexes for performance
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_upcoming" ON "bookings" ("scheduled_date", "scheduled_time") WHERE "status" IN ('pending', 'confirmed')`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_provider_active_verified" ON "service_providers" ("user_id") WHERE "is_active" = true AND "is_verified" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    await queryRunner.query(`DROP INDEX "IDX_provider_active_verified"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_upcoming"`);
    await queryRunner.query(`DROP INDEX "IDX_user_email_active"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_date_status_provider"`);

    // Removed - index doesn't exist
    await queryRunner.query(`DROP INDEX "IDX_conversation_participants"`);
    await queryRunner.query(`DROP INDEX "IDX_message_read"`);
    await queryRunner.query(`DROP INDEX "IDX_message_sender"`);
    await queryRunner.query(`DROP INDEX "IDX_message_conversation"`);

    await queryRunner.query(`DROP INDEX "IDX_audit_created_at"`);
    // Removed - index doesn't exist
    await queryRunner.query(`DROP INDEX "IDX_audit_user_action"`);

    await queryRunner.query(`DROP INDEX "IDX_dispute_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_dispute_assigned"`);
    await queryRunner.query(`DROP INDEX "IDX_dispute_type"`);
    await queryRunner.query(`DROP INDEX "IDX_dispute_status"`);

    await queryRunner.query(`DROP INDEX "IDX_admin_active"`);
    await queryRunner.query(`DROP INDEX "IDX_admin_user_level"`);

    await queryRunner.query(`DROP INDEX "IDX_availability_active"`);
    await queryRunner.query(`DROP INDEX "IDX_availability_provider_day"`);

    await queryRunner.query(`DROP INDEX "IDX_review_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_review_rating"`);
    await queryRunner.query(`DROP INDEX "IDX_review_booking"`);
    await queryRunner.query(`DROP INDEX "IDX_review_provider"`);

    await queryRunner.query(`DROP INDEX "IDX_service_price"`);
    await queryRunner.query(`DROP INDEX "IDX_service_category"`);
    await queryRunner.query(`DROP INDEX "IDX_service_provider_active"`);

    // Removed - index doesn't exist
    // Removed - index doesn't exist
    await queryRunner.query(`DROP INDEX "IDX_provider_rating"`);
    await queryRunner.query(`DROP INDEX "IDX_provider_verified_active"`);

    await queryRunner.query(`DROP INDEX "IDX_booking_payment_status"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_schedule"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_provider_status"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_customer_status"`);
    await queryRunner.query(`DROP INDEX "IDX_booking_status_date"`);

    await queryRunner.query(`DROP INDEX "IDX_user_last_login"`);
    await queryRunner.query(`DROP INDEX "IDX_user_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_user_active_verified"`);
    await queryRunner.query(`DROP INDEX "IDX_user_email"`);
  }
}
