/**
 * Conway Cloud API Client
 *
 * Low-level HTTP wrapper around the Conway REST API (https://api.conway.tech/v1).
 * Every method maps 1-to-1 to a Conway endpoint and returns typed responses.
 *
 * Authentication is handled via the CONWAY_API_KEY environment variable, which
 * is sent as a Bearer token in the Authorization header.
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { ENV } from "../_core/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConwaySandboxCreateRequest {
  name: string;
  vcpu?: number;
  memory_mb?: number;
  disk_gb?: number;
  region?: "us-east" | "eu-north";
}

export interface ConwaySandbox {
  id: string;
  name: string;
  status: "creating" | "running" | "stopped" | "error";
  region: string;
  vcpu: number;
  memory_mb: number;
  disk_gb: number;
  ip_address?: string;
  created_at: string;
}

export interface ConwayExecRequest {
  command: string;
  timeout_seconds?: number;
}

export interface ConwayExecResult {
  exit_code: number;
  stdout: string;
  stderr: string;
}

export interface ConwayFileUploadRequest {
  path: string;
  content: string;
  mode?: string; // e.g. "0644"
}

export interface ConwayPortExposeRequest {
  port: number;
  protocol?: "tcp" | "udp";
}

export interface ConwayPortExposeResult {
  public_url: string;
  port: number;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

class ConwayClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: ENV.conwayApiUrl,
      timeout: 120_000, // 2 min — sandbox creation can be slow
      headers: {
        "Content-Type": "application/json",
        ...(ENV.conwayApiKey
          ? { Authorization: `Bearer ${ENV.conwayApiKey}` }
          : {}),
      },
    });
  }

  // ---- Sandbox CRUD -------------------------------------------------------

  /** POST /v1/sandboxes — Create a new Linux sandbox. */
  async createSandbox(
    req: ConwaySandboxCreateRequest
  ): Promise<ConwaySandbox> {
    const { data } = await this.http.post<ConwaySandbox>("/sandboxes", req);
    return data;
  }

  /** GET /v1/sandboxes/:id — Poll sandbox status. */
  async getSandbox(sandboxId: string): Promise<ConwaySandbox> {
    const { data } = await this.http.get<ConwaySandbox>(
      `/sandboxes/${sandboxId}`
    );
    return data;
  }

  /** DELETE /v1/sandboxes/:id — Terminate and delete a sandbox. */
  async deleteSandbox(sandboxId: string): Promise<void> {
    await this.http.delete(`/sandboxes/${sandboxId}`);
  }

  /** POST /v1/sandboxes/:id/stop — Stop a running sandbox. */
  async stopSandbox(sandboxId: string): Promise<void> {
    await this.http.post(`/sandboxes/${sandboxId}/stop`);
  }

  /** POST /v1/sandboxes/:id/start — Start a stopped sandbox. */
  async startSandbox(sandboxId: string): Promise<void> {
    await this.http.post(`/sandboxes/${sandboxId}/start`);
  }

  // ---- Remote execution ---------------------------------------------------

  /** POST /v1/sandboxes/:id/exec — Execute a command inside the sandbox. */
  async exec(
    sandboxId: string,
    req: ConwayExecRequest
  ): Promise<ConwayExecResult> {
    const { data } = await this.http.post<ConwayExecResult>(
      `/sandboxes/${sandboxId}/exec`,
      req
    );
    return data;
  }

  // ---- File operations ----------------------------------------------------

  /** POST /v1/sandboxes/:id/files — Upload a file to the sandbox. */
  async uploadFile(
    sandboxId: string,
    req: ConwayFileUploadRequest
  ): Promise<void> {
    await this.http.post(`/sandboxes/${sandboxId}/files`, req);
  }

  // ---- Networking ---------------------------------------------------------

  /** POST /v1/sandboxes/:id/ports — Expose a port to the internet. */
  async exposePort(
    sandboxId: string,
    req: ConwayPortExposeRequest
  ): Promise<ConwayPortExposeResult> {
    const { data } = await this.http.post<ConwayPortExposeResult>(
      `/sandboxes/${sandboxId}/ports`,
      req
    );
    return data;
  }

  // ---- Utility ------------------------------------------------------------

  /** Wait until a sandbox reaches the "running" state (or times out). */
  async waitForRunning(
    sandboxId: string,
    maxWaitMs = 90_000,
    pollIntervalMs = 3_000
  ): Promise<ConwaySandbox> {
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      const sandbox = await this.getSandbox(sandboxId);
      if (sandbox.status === "running") return sandbox;
      if (sandbox.status === "error") {
        throw new Error(
          `Conway sandbox ${sandboxId} entered error state during creation`
        );
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    throw new Error(
      `Conway sandbox ${sandboxId} did not reach "running" within ${maxWaitMs}ms`
    );
  }

  /** Format an AxiosError into a human-readable message. */
  static formatError(err: unknown): string {
    if (err instanceof AxiosError) {
      const status = err.response?.status ?? "N/A";
      const body =
        typeof err.response?.data === "string"
          ? err.response.data
          : JSON.stringify(err.response?.data ?? {});
      return `Conway API ${err.config?.method?.toUpperCase()} ${err.config?.url} → ${status}: ${body}`;
    }
    return String(err);
  }
}

/** Singleton instance — import this everywhere. */
export const conwayClient = new ConwayClient();
