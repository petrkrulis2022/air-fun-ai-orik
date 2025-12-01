// WebRTC Connection Recovery Utility
// Implements exponential backoff reconnection strategy

export interface ReconnectionConfig {
  maxAttempts: number;
  backoffDelays: number[]; // in milliseconds
  timeout: number; // total timeout in milliseconds
}

export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  maxAttempts: 5,
  backoffDelays: [1000, 2000, 4000, 8000, 15000], // 1s, 2s, 4s, 8s, 15s
  timeout: 30000, // 30 seconds
};

export interface ReconnectionResult {
  success: boolean;
  attempts: number;
  totalTime: number;
  error?: Error;
}

/**
 * WebRTC Connection Recovery Manager
 * Handles automatic reconnection with exponential backoff
 */
export class WebRTCRecoveryManager {
  private config: ReconnectionConfig;

  constructor(config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG) {
    this.config = config;
  }

  /**
   * Attempt to reconnect with exponential backoff
   * @param reconnectFn Function that attempts to reconnect, returns true on success
   * @param onAttempt Optional callback called before each attempt
   * @returns ReconnectionResult with success status and metadata
   */
  async attemptReconnection(
    reconnectFn: () => Promise<boolean>,
    onAttempt?: (attempt: number, delay: number) => void
  ): Promise<ReconnectionResult> {
    const startTime = Date.now();
    let attempts = 0;

    for (let i = 0; i < this.config.maxAttempts; i++) {
      attempts++;
      const delay =
        this.config.backoffDelays[i] ||
        this.config.backoffDelays[this.config.backoffDelays.length - 1];

      // Check if we've exceeded total timeout
      const elapsed = Date.now() - startTime;
      if (elapsed >= this.config.timeout) {
        return {
          success: false,
          attempts,
          totalTime: elapsed,
          error: new Error("Reconnection timeout exceeded"),
        };
      }

      // Notify about attempt
      if (onAttempt) {
        onAttempt(attempts, delay);
      }

      try {
        // Attempt reconnection
        const success = await reconnectFn();

        if (success) {
          return {
            success: true,
            attempts,
            totalTime: Date.now() - startTime,
          };
        }
      } catch (error) {
        console.error(`Reconnection attempt ${attempts} failed:`, error);

        // If this is the last attempt, return failure
        if (i === this.config.maxAttempts - 1) {
          return {
            success: false,
            attempts,
            totalTime: Date.now() - startTime,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      }

      // Wait before next attempt (exponential backoff)
      await this.sleep(delay);
    }

    return {
      success: false,
      attempts,
      totalTime: Date.now() - startTime,
      error: new Error("Max reconnection attempts reached"),
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate next backoff delay
   */
  getBackoffDelay(attempt: number): number {
    const index = Math.min(attempt - 1, this.config.backoffDelays.length - 1);
    return this.config.backoffDelays[index];
  }

  /**
   * Check if reconnection should be attempted based on elapsed time
   */
  shouldAttemptReconnection(elapsedTime: number): boolean {
    return elapsedTime < this.config.timeout;
  }
}

/**
 * Create a reconnection manager with custom config
 */
export function createRecoveryManager(config?: Partial<ReconnectionConfig>): WebRTCRecoveryManager {
  const fullConfig = {
    ...DEFAULT_RECONNECTION_CONFIG,
    ...config,
  };
  return new WebRTCRecoveryManager(fullConfig);
}

/**
 * Notification types for connection recovery
 */
export enum RecoveryNotificationType {
  ATTEMPTING = "attempting",
  SUCCESS = "success",
  FAILED = "failed",
  TIMEOUT = "timeout",
}

export interface RecoveryNotification {
  type: RecoveryNotificationType;
  attempt?: number;
  totalAttempts?: number;
  delay?: number;
  message: string;
}

/**
 * Generate user-friendly notification for recovery status
 */
export function generateRecoveryNotification(
  type: RecoveryNotificationType,
  attempt?: number,
  totalAttempts?: number,
  delay?: number
): RecoveryNotification {
  switch (type) {
    case RecoveryNotificationType.ATTEMPTING:
      return {
        type,
        attempt,
        totalAttempts,
        delay,
        message: `Attempting to reconnect (${attempt}/${totalAttempts})... Retrying in ${delay}ms`,
      };

    case RecoveryNotificationType.SUCCESS:
      return {
        type,
        attempt,
        message: `Successfully reconnected after ${attempt} attempt(s)`,
      };

    case RecoveryNotificationType.FAILED:
      return {
        type,
        totalAttempts,
        message: `Failed to reconnect after ${totalAttempts} attempts`,
      };

    case RecoveryNotificationType.TIMEOUT:
      return {
        type,
        message: "Reconnection timeout (30 seconds). Please reload the stream.",
      };

    default:
      return {
        type,
        message: "Unknown recovery status",
      };
  }
}
