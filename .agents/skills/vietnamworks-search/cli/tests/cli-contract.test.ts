import { describe, expect, test } from "bun:test";
import { parseJSON, runCLI, runWithFixture } from "./helpers";

function err(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

describe("VietnamWorks CLI contract", () => {
  test("search emits { meta, results } with the /scrape contract fields", async () => {
    const { result } = await runWithFixture(["search", "-q", "data engineer"]);
    const out = parseJSON<{ meta: { count: number; page: number }; results: any[] }>(result);
    expect(out.meta.count).toBe(2);
    expect(out.meta.page).toBe(1);
    for (const job of out.results) {
      for (const key of ["id", "title", "company", "location", "date", "url"]) {
        expect(job).toHaveProperty(key);
      }
      expect(job.url).toStartWith("https://www.vietnamworks.com/");
      expect(job.url).not.toContain("?");
      expect(job.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(out.results[0].id).toBe("2121660");
    expect(out.results[0].location).toBe("Hồ Chí Minh");
  });

  test("query, cities and page are sent in the request body", async () => {
    const { result, bodies } = await runWithFixture(["search", "-q", "kế toán", "-l", "Hà Nội,dn", "--page", "2"]);
    expect(result.exitCode).toBe(0);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].query).toBe("kế toán");
    expect(bodies[0].page).toBe(1);
    expect(bodies[0].filter).toEqual([{ field: "workingLocations.cityId", value: "24,17" }]);
    expect(bodies[0].order).toEqual([]);
  });

  test("--jobage sorts newest first", async () => {
    const { result, bodies } = await runWithFixture(["search", "-q", "x", "--jobage", "3650"]);
    expect(result.exitCode).toBe(0);
    expect(bodies[0].order).toEqual([{ field: "approvedOn", value: "desc" }]);
  });

  test("--limit caps results client-side", async () => {
    const { result } = await runWithFixture(["search", "-q", "x", "--limit", "1"]);
    expect(parseJSON<{ results: any[] }>(result).results).toHaveLength(1);
  });

  test("table format prints a header row", async () => {
    const { result } = await runWithFixture(["search", "-q", "x", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toStartWith("ID");
  });

  test("detail returns description and requirements as plain text", async () => {
    const { result, bodies } = await runWithFixture(["detail", "2121660"]);
    const job = parseJSON<any>(result);
    expect(bodies[0].filter).toEqual([{ field: "jobId", value: "2121660" }]);
    expect(job.title).toBe("AI Enablement/ Business Applications Engineer");
    expect(job.description).toBeTruthy();
    expect(job.description).not.toMatch(/<[a-z]/i);
    expect(job.requirements).toBeTruthy();
    expect(Array.isArray(job.skills)).toBe(true);
  });

  test("detail on an id the API does not return exits 1 NOT_FOUND", async () => {
    const { result } = await runWithFixture(["detail", "9999999"]);
    expect(result.exitCode).toBe(1);
    expect(err(result.stderr).code).toBe("NOT_FOUND");
  });
});

describe("VietnamWorks CLI validation (no network)", () => {
  test("unknown flag exits 1 with UNKNOWN_FLAG", async () => {
    const r = await runCLI(["search", "--bogus", "x"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("UNKNOWN_FLAG");
  });

  test("unknown location exits 1 with BAD_LOCATION", async () => {
    const r = await runCLI(["search", "-q", "x", "-l", "Paris"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("BAD_LOCATION");
  });

  for (const flag of ["jobage", "page", "limit"]) {
    test(`--${flag} fractional exits 1 with BAD_ARG`, async () => {
      const r = await runCLI(["search", "-q", "x", `--${flag}`, "1.5"]);
      expect(r.exitCode).toBe(1);
      expect(err(r.stderr).code).toBe("BAD_ARG");
    });
  }

  test("bare --query exits 1 with BAD_ARG", async () => {
    const r = await runCLI(["search", "--query"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("BAD_ARG");
  });

  test("bad --format exits 1", async () => {
    const r = await runCLI(["search", "-q", "x", "--format", "xml"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("BAD_ARG");
  });

  test("detail without id exits 1 NO_ID", async () => {
    const r = await runCLI(["detail"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("NO_ID");
  });

  test("detail on a foreign host exits 1 BAD_ID", async () => {
    const r = await runCLI(["detail", "https://vietnamworks.com.evil.io/job-1234567-jv"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("BAD_ID");
  });
});
