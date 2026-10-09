ALTER TYPE "WebhookDeliveryStatus" ADD VALUE 'PROCESSING';
ALTER TABLE "WebhookEndpoint" ADD COLUMN "encryptedSecret" TEXT;
ALTER TABLE "WebhookDelivery" ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);
