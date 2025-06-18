import { Injectable } from '@nestjs/common';
import { formatBytes } from './helpers/formatBytes';
import { calculateJitter } from './helpers/calculateJitter';
import { calculateBandwidth } from './helpers/calculateBandwidth';
import {
  calculateSafeConcurrency,
  ConcurrencyLatencyEntry,
} from './helpers/calculateSafeConcurrency';
import * as os from 'os';
import { Request, Response } from 'express';

// Constantes de configuración de métricas
const RECENT_ERRORS_SIZE = 10;
const LATENCY_HISTORY_SIZE = 20;
const CONCURRENCY_LATENCY_HISTORY_SIZE = 100;
const LATENCY_THRESHOLD = 500; // ms
const ERROR_RATE_THRESHOLD = 0.05; // 5%

@Injectable()
export class AppService {
  // Variables internas para mantener el estado de las métricas
  private recentErrors: string[] = [];
  private latencyHistory: number[] = [];
  private concurrencyLatencyHistory: ConcurrencyLatencyEntry[] = [];
  private totalRequests = 0;
  private concurrentRequests = 0;
  private totalErrors = 0;

  public incrementTotalRequests(): void {
    this.totalRequests++;
  }

  public incrementConcurrentRequests(): void {
    this.concurrentRequests++;
  }

  public decrementConcurrentRequests(): void {
    if (this.concurrentRequests > 0) {
      this.concurrentRequests--;
    }
  }

  public incrementTotalErrors(): void {
    this.totalErrors++;
  }

  public recordError(error: any): void {
    this.recentErrors.push(
      JSON.stringify({
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    );
    if (this.recentErrors.length > RECENT_ERRORS_SIZE) {
      this.recentErrors.shift();
    }
  }

  public computeMetrics(
    data: any,
    req: Request,
    res: Response,
    duration: number,
  ): any {
    this.latencyHistory.push(duration);
    if (this.latencyHistory.length > LATENCY_HISTORY_SIZE) {
      this.latencyHistory.shift();
    }
    const jitterResult = calculateJitter(this.latencyHistory);

    const responseSizeBytes = Buffer.byteLength(
      JSON.stringify(data ?? ''),
      'utf8',
    );
    const bandwidthResult = calculateBandwidth(responseSizeBytes, duration);

    this.concurrencyLatencyHistory.push({
      concurrent: this.concurrentRequests,
      latency: duration,
    });
    if (
      this.concurrencyLatencyHistory.length > CONCURRENCY_LATENCY_HISTORY_SIZE
    ) {
      this.concurrencyLatencyHistory.shift();
    }
    const safeConcurrency = calculateSafeConcurrency(
      this.concurrencyLatencyHistory,
      LATENCY_THRESHOLD,
      this.totalRequests > 0 ? this.totalErrors / this.totalRequests : 0,
      ERROR_RATE_THRESHOLD,
    );

    const metrics = {
      // Response capability (30%)
      latency: `${duration}ms`,
      jitter: jitterResult,
      uptime: process.uptime(),

      // Usage (20%)
      memoryUsage: process.memoryUsage(),
      cpu: process.cpuUsage(),
      cpus: os.cpus().length,
      bandwidth: bandwidthResult,

      // Health (15%)
      totalErrors: this.totalErrors,
      recentErrors: this.recentErrors,
      errorRate:
        this.totalRequests > 0 ? this.totalErrors / this.totalRequests : 0,

      // Concurrency (15%)
      safeConcurrency: safeConcurrency,

      // Priority (10%)
      priority: process.env.PRIORITY || 'normal',

      // Counters
      concurrentRequests: this.concurrentRequests,
      totalRequests: this.totalRequests,
    };

    return {
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
      statusCode: res.statusCode,
      metrics,
      data: data,
    };
  }

  async getMetrics(): Promise<Record<string, unknown>> {
    return {
      totalRequests: this.totalRequests,
      concurrentRequests: this.concurrentRequests,
      totalErrors: this.totalErrors,
      recentErrors: this.recentErrors,
      uptime: process.uptime(),
    };
  }

  async getHello(): Promise<{ response: string }> {
    const time = Math.floor(Math.random() * 2000) + 1;
    await new Promise((resolve) => setTimeout(resolve, time));
    return { response: 'Hello from Load Balancer! (app.service.ts)' };
  }

  async getMultipleResponses(): Promise<{ response: string }[]> {
    const responses: { response: string }[] = [];
    for (let i = 0; i < 10; i++) {
      responses.push({ response: `Response ${i + 1} from Load Balancer!` });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return responses;
  }

  async getErrorResponse(): Promise<{ error: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    throw new Error('This is a simulated error response from Load Balancer!');
  }

  async fetchPokemon(): Promise<any> {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/squirtle');
    if (!response.ok) {
      throw new Error('Failed to fetch Pokemon data');
    }
    return response.json();
  }
}
