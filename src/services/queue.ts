import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  createdAt: number;
}

class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;
  private maxSize: number;
  private rateLimitDelay: number;
  private requestTimeout: number;
  private queueTimeout: number;

  constructor() {
    this.maxSize = config.steam.maxQueueSize;
    this.rateLimitDelay = config.steam.rateLimitDelay;
    this.requestTimeout = config.steam.requestTimeout;
    this.queueTimeout = config.steam.queueTimeout;
  }

  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.queue.length >= this.maxSize) {
        reject(new Error('Queue is full'));
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = Date.now();

      // Queue timeout
      const queueTimeout = setTimeout(() => {
        const index = this.queue.findIndex((req) => req.id === id);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(new Error('Request timed out in queue'));
        }
      }, this.queueTimeout);

      // Request timeout
      const requestTimeout = setTimeout(() => {
        const index = this.queue.findIndex((req) => req.id === id);
        if (index !== -1) {
          this.queue.splice(index, 1);
          clearTimeout(queueTimeout);
          reject(new Error('Request execution timed out'));
        }
      }, this.requestTimeout + this.queueTimeout);

      const queuedRequest: QueuedRequest<T> = {
        id,
        execute: async () => {
          clearTimeout(queueTimeout);
          clearTimeout(requestTimeout);
          return execute();
        },
        resolve: (value: T) => {
          clearTimeout(queueTimeout);
          clearTimeout(requestTimeout);
          resolve(value);
        },
        reject: (error: Error) => {
          clearTimeout(queueTimeout);
          clearTimeout(requestTimeout);
          reject(error);
        },
        timeout: requestTimeout,
        createdAt,
      } as QueuedRequest<unknown> as QueuedRequest<T>;

      this.queue.push(queuedRequest as QueuedRequest<unknown>);
      logger.debug(`Request ${id} queued. Queue size: ${this.queue.length}`);

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) {
        break;
      }

      try {
        logger.debug(`Processing request ${request.id}`);
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }

      // Rate limiting: wait before processing next request
      if (this.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
      }
    }

    this.processing = false;
  }

  getStats() {
    return {
      pending: this.queue.length,
      processing: this.processing ? 1 : 0,
      maxSize: this.maxSize,
    };
  }

  clear(): void {
    this.queue.forEach((request) => {
      clearTimeout(request.timeout);
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.processing = false;
  }
}

export const requestQueue = new RequestQueue();
