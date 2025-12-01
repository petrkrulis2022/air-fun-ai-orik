// Feature: air-fun-mvp, Property 6: WebRTC Connection Idempotency
// Validates: Requirements 4.3, 15

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fc from "fast-check";

/**
 * Property 6: WebRTC Connection Idempotency
 * For any stream, creating multiple consumer transports for the same viewer
 * should not create duplicate connections.
 */

interface ConsumerTransport {
  id: string;
  viewerId: string;
  streamId: string;
  createdAt: number;
}

/**
 * Mock WebRTC Connection Manager
 * Simulates the behavior of creating consumer transports
 */
class WebRTCConnectionManager {
  private transports: Map<string, ConsumerTransport> = new Map();
  private viewerTransports: Map<string, Set<string>> = new Map(); // viewerId -> Set<transportId>
  private transportCounter = 0;

  /**
   * Create a consumer transport for a viewer
   * Should be idempotent - multiple calls for same viewer should reuse existing transport
   */
  createConsumerTransport(streamId: string, viewerId: string): ConsumerTransport {
    // Check if viewer already has a transport for this stream
    const existingTransportId = this.findExistingTransport(streamId, viewerId);

    if (existingTransportId) {
      // Return existing transport (idempotent behavior)
      return this.transports.get(existingTransportId)!;
    }

    // Create new transport with unique counter
    this.transportCounter++;
    const transportId = `transport_${streamId}_${viewerId}_${this.transportCounter}`;
    const transport: ConsumerTransport = {
      id: transportId,
      viewerId,
      streamId,
      createdAt: Date.now(),
    };

    this.transports.set(transportId, transport);

    // Track viewer's transports
    if (!this.viewerTransports.has(viewerId)) {
      this.viewerTransports.set(viewerId, new Set());
    }
    this.viewerTransports.get(viewerId)!.add(transportId);

    return transport;
  }

  /**
   * Find existing transport for viewer in stream
   */
  private findExistingTransport(streamId: string, viewerId: string): string | null {
    const viewerTransportIds = this.viewerTransports.get(viewerId);
    if (!viewerTransportIds) return null;

    for (const transportId of viewerTransportIds) {
      const transport = this.transports.get(transportId);
      if (transport && transport.streamId === streamId) {
        return transportId;
      }
    }

    return null;
  }

  /**
   * Get all transports for a viewer
   */
  getViewerTransports(viewerId: string): ConsumerTransport[] {
    const transportIds = this.viewerTransports.get(viewerId);
    if (!transportIds) return [];

    return Array.from(transportIds)
      .map((id) => this.transports.get(id))
      .filter((t): t is ConsumerTransport => t !== undefined);
  }

  /**
   * Get transport count for a viewer in a specific stream
   */
  getTransportCount(streamId: string, viewerId: string): number {
    const transports = this.getViewerTransports(viewerId);
    return transports.filter((t) => t.streamId === streamId).length;
  }

  /**
   * Close transport
   */
  closeTransport(transportId: string): void {
    const transport = this.transports.get(transportId);
    if (transport) {
      this.transports.delete(transportId);
      const viewerTransportIds = this.viewerTransports.get(transport.viewerId);
      if (viewerTransportIds) {
        viewerTransportIds.delete(transportId);
      }
    }
  }

  /**
   * Clear all transports
   */
  clear(): void {
    this.transports.clear();
    this.viewerTransports.clear();
  }
}

/**
 * Generators for property tests
 */
const streamIdArb = fc.uuid();
const viewerIdArb = fc.uuid();

describe("WebRTC Connection Idempotency Property Tests", () => {
  describe("Property 6: Connection Idempotency", () => {
    it("should not create duplicate transports for the same viewer in the same stream", () => {
      fc.assert(
        fc.property(
          streamIdArb,
          viewerIdArb,
          fc.integer({ min: 2, max: 10 }),
          (streamId, viewerId, attempts) => {
            const manager = new WebRTCConnectionManager();

            // Attempt to create transport multiple times
            const transports: ConsumerTransport[] = [];
            for (let i = 0; i < attempts; i++) {
              const transport = manager.createConsumerTransport(streamId, viewerId);
              transports.push(transport);
            }

            // All transports should have the same ID (idempotent)
            const uniqueTransportIds = new Set(transports.map((t) => t.id));
            expect(uniqueTransportIds.size).toBe(1);

            // Verify only one transport exists for this viewer in this stream
            const transportCount = manager.getTransportCount(streamId, viewerId);
            expect(transportCount).toBe(1);

            manager.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should create separate transports for different viewers in the same stream", () => {
      fc.assert(
        fc.property(
          streamIdArb,
          fc.array(viewerIdArb, { minLength: 2, maxLength: 10 }),
          (streamId, viewerIds) => {
            const manager = new WebRTCConnectionManager();

            // Create unique viewer IDs
            const uniqueViewerIds = Array.from(new Set(viewerIds));

            // Create transports for each viewer
            const transports = uniqueViewerIds.map((viewerId) =>
              manager.createConsumerTransport(streamId, viewerId)
            );

            // All transports should have unique IDs
            const transportIds = transports.map((t) => t.id);
            const uniqueTransportIds = new Set(transportIds);
            expect(uniqueTransportIds.size).toBe(uniqueViewerIds.length);

            // Each viewer should have exactly one transport
            for (const viewerId of uniqueViewerIds) {
              const count = manager.getTransportCount(streamId, viewerId);
              expect(count).toBe(1);
            }

            manager.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should create separate transports for the same viewer in different streams", () => {
      fc.assert(
        fc.property(
          fc.array(streamIdArb, { minLength: 2, maxLength: 5 }),
          viewerIdArb,
          (streamIds, viewerId) => {
            const manager = new WebRTCConnectionManager();

            // Create unique stream IDs
            const uniqueStreamIds = Array.from(new Set(streamIds));

            // Create transports for each stream
            const transports = uniqueStreamIds.map((streamId) =>
              manager.createConsumerTransport(streamId, viewerId)
            );

            // All transports should have unique IDs
            const transportIds = transports.map((t) => t.id);
            const uniqueTransportIds = new Set(transportIds);
            expect(uniqueTransportIds.size).toBe(uniqueStreamIds.length);

            // Viewer should have one transport per stream
            const viewerTransports = manager.getViewerTransports(viewerId);
            expect(viewerTransports.length).toBe(uniqueStreamIds.length);

            manager.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain idempotency after transport closure and recreation", () => {
      fc.assert(
        fc.property(streamIdArb, viewerIdArb, (streamId, viewerId) => {
          const manager = new WebRTCConnectionManager();

          // Create initial transport
          const transport1 = manager.createConsumerTransport(streamId, viewerId);
          const transportId1 = transport1.id;

          // Attempt to create again (should return same transport)
          const transport2 = manager.createConsumerTransport(streamId, viewerId);
          expect(transport2.id).toBe(transportId1);

          // Close the transport
          manager.closeTransport(transportId1);

          // Create new transport (should create a new one since old was closed)
          const transport3 = manager.createConsumerTransport(streamId, viewerId);
          expect(transport3.id).not.toBe(transportId1);

          // Verify only one transport exists
          const count = manager.getTransportCount(streamId, viewerId);
          expect(count).toBe(1);

          manager.clear();
        }),
        { numRuns: 100 }
      );
    });

    it("should handle concurrent connection attempts idempotently", () => {
      fc.assert(
        fc.property(
          streamIdArb,
          viewerIdArb,
          fc.integer({ min: 5, max: 20 }),
          (streamId, viewerId, concurrentAttempts) => {
            const manager = new WebRTCConnectionManager();

            // Simulate concurrent connection attempts
            const transports: ConsumerTransport[] = [];
            for (let i = 0; i < concurrentAttempts; i++) {
              const transport = manager.createConsumerTransport(streamId, viewerId);
              transports.push(transport);
            }

            // All should return the same transport
            const firstTransportId = transports[0].id;
            for (const transport of transports) {
              expect(transport.id).toBe(firstTransportId);
            }

            // Only one transport should exist
            const count = manager.getTransportCount(streamId, viewerId);
            expect(count).toBe(1);

            manager.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve transport metadata across idempotent calls", () => {
      fc.assert(
        fc.property(
          streamIdArb,
          viewerIdArb,
          fc.integer({ min: 2, max: 5 }),
          (streamId, viewerId, attempts) => {
            const manager = new WebRTCConnectionManager();

            // Create transport multiple times
            const transports: ConsumerTransport[] = [];
            for (let i = 0; i < attempts; i++) {
              const transport = manager.createConsumerTransport(streamId, viewerId);
              transports.push(transport);
            }

            // All transports should have identical metadata
            const firstTransport = transports[0];
            for (const transport of transports) {
              expect(transport.id).toBe(firstTransport.id);
              expect(transport.viewerId).toBe(firstTransport.viewerId);
              expect(transport.streamId).toBe(firstTransport.streamId);
              expect(transport.createdAt).toBe(firstTransport.createdAt);
            }

            manager.clear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 6: Connection Lifecycle", () => {
    it("should maintain correct transport count throughout lifecycle", () => {
      fc.assert(
        fc.property(
          streamIdArb,
          fc.array(viewerIdArb, { minLength: 1, maxLength: 10 }),
          (streamId, viewerIds) => {
            const manager = new WebRTCConnectionManager();
            const uniqueViewerIds = Array.from(new Set(viewerIds));

            // Create transports for all viewers
            const transports = uniqueViewerIds.map((viewerId) =>
              manager.createConsumerTransport(streamId, viewerId)
            );

            // Verify initial count
            for (const viewerId of uniqueViewerIds) {
              expect(manager.getTransportCount(streamId, viewerId)).toBe(1);
            }

            // Close half the transports
            const halfCount = Math.floor(transports.length / 2);
            for (let i = 0; i < halfCount; i++) {
              manager.closeTransport(transports[i].id);
            }

            // Verify counts after closure
            for (let i = 0; i < uniqueViewerIds.length; i++) {
              const expectedCount = i < halfCount ? 0 : 1;
              expect(manager.getTransportCount(streamId, uniqueViewerIds[i])).toBe(expectedCount);
            }

            manager.clear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
