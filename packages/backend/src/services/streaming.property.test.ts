// Feature: air-fun-mvp, Property 12: Stream Lifecycle State Machine
// Validates: Requirements 3.1, 3.3

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fc from "fast-check";

/**
 * Property 12: Stream Lifecycle State Machine
 * For any stream, valid state transitions are: null → "live" → "ended",
 * and no other transitions are permitted.
 */

type StreamStatus = "live" | "ended" | null;

interface StreamState {
  status: StreamStatus;
  startedAt?: number;
  endedAt?: number;
}

/**
 * State machine for stream lifecycle
 */
class StreamStateMachine {
  private state: StreamState = { status: null };

  getStatus(): StreamStatus {
    return this.state.status;
  }

  start(): void {
    if (this.state.status !== null) {
      throw new Error(`Cannot start stream from status: ${this.state.status}`);
    }
    this.state = {
      status: "live",
      startedAt: Date.now(),
    };
  }

  end(): void {
    if (this.state.status !== "live") {
      throw new Error(`Cannot end stream from status: ${this.state.status}`);
    }
    this.state = {
      ...this.state,
      status: "ended",
      endedAt: Date.now(),
    };
  }

  getState(): StreamState {
    return { ...this.state };
  }
}

/**
 * Valid stream lifecycle actions
 */
type StreamAction = "start" | "end";

/**
 * Generator for valid stream action sequences
 * Only generates sequences that follow the state machine rules
 */
const validStreamActionSequenceArb = fc
  .array(fc.constantFrom<StreamAction>("start", "end"), { minLength: 1, maxLength: 10 })
  .map((actions) => {
    // Filter to create a valid sequence
    const validSequence: StreamAction[] = [];
    let currentStatus: StreamStatus = null;

    for (const action of actions) {
      if (action === "start" && currentStatus === null) {
        validSequence.push(action);
        currentStatus = "live";
      } else if (action === "end" && currentStatus === "live") {
        validSequence.push(action);
        currentStatus = "ended";
      }
      // Skip invalid actions
    }

    return validSequence;
  })
  .filter((seq) => seq.length > 0);

/**
 * Generator for invalid stream action sequences
 * Generates sequences that violate the state machine rules
 */
const invalidStreamActionSequenceArb = fc.oneof(
  // Try to start when already live
  fc.constant(["start", "start"]),
  // Try to end when not live
  fc.constant(["end"]),
  // Try to start after ended
  fc.constant(["start", "end", "start"]),
  // Try to end when already ended
  fc.constant(["start", "end", "end"])
);

describe("Stream Lifecycle State Machine Property Tests", () => {
  describe("Property 12: Valid State Transitions", () => {
    it("should only allow null → live → ended transitions", () => {
      fc.assert(
        fc.property(validStreamActionSequenceArb, (actions) => {
          const stateMachine = new StreamStateMachine();
          let lastStatus: StreamStatus = null;

          // All valid actions should execute without error
          for (const action of actions) {
            if (action === "start") {
              expect(stateMachine.getStatus()).toBe(null);
              stateMachine.start();
              expect(stateMachine.getStatus()).toBe("live");
              lastStatus = "live";
            } else if (action === "end") {
              expect(stateMachine.getStatus()).toBe("live");
              stateMachine.end();
              expect(stateMachine.getStatus()).toBe("ended");
              lastStatus = "ended";
            }
          }

          // Verify final state is valid
          const finalStatus = stateMachine.getStatus();
          expect(["live", "ended"]).toContain(finalStatus);

          // Verify state progression
          if (lastStatus === "ended") {
            const state = stateMachine.getState();
            expect(state.startedAt).toBeDefined();
            expect(state.endedAt).toBeDefined();
            expect(state.endedAt).toBeGreaterThanOrEqual(state.startedAt!);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should reject invalid state transitions", () => {
      fc.assert(
        fc.property(invalidStreamActionSequenceArb, (actions) => {
          const stateMachine = new StreamStateMachine();
          let errorThrown = false;

          try {
            for (const action of actions) {
              if (action === "start") {
                stateMachine.start();
              } else if (action === "end") {
                stateMachine.end();
              }
            }
          } catch (error) {
            errorThrown = true;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toMatch(/Cannot (start|end) stream from status/);
          }

          // At least one invalid sequence should throw an error
          expect(errorThrown).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain monotonic timestamps", () => {
      fc.assert(
        fc.property(fc.constant(["start", "end"]), (actions) => {
          const stateMachine = new StreamStateMachine();

          stateMachine.start();
          const stateAfterStart = stateMachine.getState();

          stateMachine.end();
          const stateAfterEnd = stateMachine.getState();

          // Verify timestamps are monotonic
          expect(stateAfterEnd.startedAt).toBeDefined();
          expect(stateAfterEnd.endedAt).toBeDefined();
          expect(stateAfterEnd.endedAt!).toBeGreaterThanOrEqual(stateAfterEnd.startedAt!);
        }),
        { numRuns: 100 }
      );
    });

    it("should not allow restarting an ended stream", () => {
      fc.assert(
        fc.property(fc.constant(["start", "end", "start"]), (actions) => {
          const stateMachine = new StreamStateMachine();

          stateMachine.start();
          expect(stateMachine.getStatus()).toBe("live");

          stateMachine.end();
          expect(stateMachine.getStatus()).toBe("ended");

          // Attempting to start again should throw
          expect(() => stateMachine.start()).toThrow(/Cannot start stream from status: ended/);
        }),
        { numRuns: 100 }
      );
    });

    it("should not allow ending a stream that was never started", () => {
      fc.assert(
        fc.property(fc.constant(["end"]), (actions) => {
          const stateMachine = new StreamStateMachine();

          expect(stateMachine.getStatus()).toBe(null);

          // Attempting to end without starting should throw
          expect(() => stateMachine.end()).toThrow(/Cannot end stream from status: null/);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve state immutability", () => {
      fc.assert(
        fc.property(fc.constant(["start"]), (actions) => {
          const stateMachine = new StreamStateMachine();

          stateMachine.start();
          const state1 = stateMachine.getState();
          const state2 = stateMachine.getState();

          // Verify we get copies, not references
          expect(state1).not.toBe(state2);
          expect(state1).toEqual(state2);

          // Modifying returned state should not affect internal state
          state1.status = "ended";
          expect(stateMachine.getStatus()).toBe("live");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 12: State Transition Sequences", () => {
    it("should handle rapid state transitions correctly", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (iterations) => {
          // Test that we can create and end multiple streams in sequence
          for (let i = 0; i < iterations; i++) {
            const stateMachine = new StreamStateMachine();

            expect(stateMachine.getStatus()).toBe(null);
            stateMachine.start();
            expect(stateMachine.getStatus()).toBe("live");
            stateMachine.end();
            expect(stateMachine.getStatus()).toBe("ended");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should enforce exactly one start and one end per stream lifecycle", () => {
      fc.assert(
        fc.property(fc.constant(true), () => {
          const stateMachine = new StreamStateMachine();

          // Track transition counts
          let startCount = 0;
          let endCount = 0;

          // Start the stream
          stateMachine.start();
          startCount++;

          // Verify we can't start again
          expect(() => {
            stateMachine.start();
            startCount++;
          }).toThrow();

          // End the stream
          stateMachine.end();
          endCount++;

          // Verify we can't end again
          expect(() => {
            stateMachine.end();
            endCount++;
          }).toThrow();

          // Verify exactly one start and one end succeeded
          expect(startCount).toBe(1);
          expect(endCount).toBe(1);
        }),
        { numRuns: 100 }
      );
    });
  });
});
