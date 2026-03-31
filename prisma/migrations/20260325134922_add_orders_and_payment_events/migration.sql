-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CANCELED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "stripe_checkout_session_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_id" TEXT,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripe_checkout_session_id_key" ON "orders"("stripe_checkout_session_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_status_idx" ON "orders"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "orders_listing_id_idx" ON "orders"("listing_id");

-- CreateIndex
CREATE INDEX "orders_stripe_checkout_session_id_idx" ON "orders"("stripe_checkout_session_id");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_stripe_event_id_key" ON "payment_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "payment_events_stripe_event_id_idx" ON "payment_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "payment_events_type_idx" ON "payment_events"("type");

-- CreateIndex
CREATE INDEX "payment_events_processed_at_idx" ON "payment_events"("processed_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
