// src/__tests__/rate-limit.test.ts
import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows first request", () => {
    const result = checkRateLimit("127.0.0.1", 10, 3600000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("allows up to limit then blocks", () => {
    const ip = "192.168.1.1";
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(ip, 5, 3600000);
      expect(result.allowed).toBe(i < 4);
    }
  });

  it("returns correct remaining count", () => {
    const ip = "10.0.0.1";
    checkRateLimit(ip, 3, 3600000);
    const result = checkRateLimit(ip, 3, 3600000);
    expect(result.remaining).toBe(1);
  });
});
