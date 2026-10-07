-- CreateEnum
CREATE TYPE "Region" AS ENUM ('WEST', 'MIDWEST', 'NE', 'SOUTH');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('ORDERED', 'BACKORDER', 'PACKED', 'IN_TRANSIT', 'DELIVERED');

-- CreateEnum
CREATE TYPE "Timing" AS ENUM ('ON_TIME', 'AT_RISK', 'LATE');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "destinationState" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "displayFulfillmentStatus" TEXT NOT NULL,
    "holdReason" TEXT,
    "assignedLocationId" TEXT NOT NULL,
    "region" "Region",
    "stage" "Stage",
    "timing" "Timing",
    "daysLate" INTEGER,
    "computedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT,
    "orderId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "inTransitAt" TIMESTAMP(3),
    "estimatedDeliveryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_shopifyId_key" ON "Location"("shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_shopifyId_key" ON "Order"("shopifyId");

-- CreateIndex
CREATE INDEX "Order_assignedLocationId_idx" ON "Order"("assignedLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shopifyId_key" ON "Shipment"("shopifyId");

-- CreateIndex
CREATE INDEX "Shipment_locationId_idx" ON "Shipment"("locationId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedLocationId_fkey" FOREIGN KEY ("assignedLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
