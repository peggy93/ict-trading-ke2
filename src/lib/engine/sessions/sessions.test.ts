import { describe, expect, it } from "vitest";
import { killzoneStatus, sessionStatus } from "./index";

// Fixed UTC instants for deterministic assertions.
const at = (hourUtc: number) => Date.UTC(2026, 0, 5, hourUtc, 0, 0);

describe("sessions/sessionStatus", () => {
  it("marks London active at 08:00 UTC", () => {
    const s = sessionStatus(at(8)).find((x) => x.name === "London")!;
    expect(s.active).toBe(true);
    expect(s.killzone).toBe(true); // 07-10 UTC KZ
  });

  it("marks Asia active at 02:00 UTC and London closed", () => {
    const sessions = sessionStatus(at(2));
    expect(sessions.find((x) => x.name === "Asia")!.active).toBe(true);
    expect(sessions.find((x) => x.name === "London")!.active).toBe(false);
  });

  it("New York inactive at 06:00 UTC with a positive open countdown", () => {
    const ny = sessionStatus(at(6)).find((x) => x.name === "NewYork")!;
    expect(ny.active).toBe(false);
    expect(ny.opensInMs).toBeGreaterThan(0);
  });
});

describe("sessions/killzoneStatus", () => {
  it("activates London Open killzone at 08:00 UTC", () => {
    const kz = killzoneStatus(at(8)).find((k) => k.name === "LondonOpen")!;
    expect(kz.active).toBe(true);
  });

  it("activates London Close killzone at 15:30 UTC", () => {
    const kz = killzoneStatus(Date.UTC(2026, 0, 5, 15, 30, 0)).find((k) => k.name === "LondonClose")!;
    expect(kz.active).toBe(true);
  });
});
