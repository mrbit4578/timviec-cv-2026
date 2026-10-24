import { describe, expect, test } from "bun:test";
import { parseJSON, runCLI, runWithFixture } from "./helpers";

function err(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

describe("ITviec CLI contract", () => {
  test("search emits { meta, results } with the /scrape contract fields", async () => {
    const { result } = await runWithFixture(["search", "-q", "python"]);
    const out = parseJSON<{ meta: { count: number; page: number }; results: any[] }>(result);
    expect(out.meta).toEqual({ count: 2, page: 1 });
    for (const job of out.results) {
      for (const key of ["id", "title", "company", "location", "date", "url"]) expect(job).toHaveProperty(key);
      expect(job.url).toStartWith("https://itviec.com/it-jobs/");
      expect(job.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(out.results[0].title).toBe("Data Engineer (SQL, NoSQL, Hadoop, Python, Java)");
    expect(out.results[0].company).toBe("VietinBank");
    expect(out.results[0].location).toBe("Ha Noi");
    expect(out.results[0].workplace).toBe("At office");
    expect(out.results[0].skills).toContain("Python");
  });

  test("keyword, city and page build ITviec's path URL", async () => {
    const { requests } = await runWithFixture(["search", "-q", "React Native", "-l", "Hà Nội", "--page", "2"]);
    expect(requests.map((u) => u.pathname + u.search)).toEqual(["/it-jobs/react-native/ha-noi?page=2"]);
  });

  test("no query with a city lists all IT jobs in that city", async () => {
    const { requests } = await runWithFixture(["search", "-l", "hcm"]);
    expect(requests[0].pathname).toBe("/it-jobs/ho-chi-minh-hcm");
  });

  test("an unknown term (ITviec 404) is zero results, exit 0", async () => {
    const { result } = await runWithFixture(["search", "-q", "not a term"]);
    expect(parseJSON<{ meta: { count: number } }>(result).meta.count).toBe(0);
  });

  test("--remote filters by workplace client-side", async () => {
    const { result } = await runWithFixture(["search", "-q", "python", "--remote", "remote"]);
    expect(parseJSON<{ results: any[] }>(result).results).toHaveLength(0);
    const { result: onsite } = await runWithFixture(["search", "-q", "python", "--remote", "onsite"]);
    expect(parseJSON<{ results: any[] }>(onsite).results).toHaveLength(2);
  });

  test("--limit caps results", async () => {
    const { result } = await runWithFixture(["search", "-q", "python", "--limit", "1"]);
    expect(parseJSON<{ results: any[] }>(result).results).toHaveLength(1);
  });

  test("detail reads the JobPosting JSON-LD", async () => {
    const { result, requests } = await runWithFixture([
      "detail",
      "https://itviec.com/it-jobs/data-engineer-sql-nosql-hadoop-python-java-vietinbank-1250?lab_feature=x",
    ]);
    const job = parseJSON<any>(result);
    expect(requests[0].pathname).toBe("/it-jobs/data-engineer-sql-nosql-hadoop-python-java-vietinbank-1250");
    expect(job.company).toBe("VietinBank");
    expect(job.date).toBe("2026-10-08");
    expect(job.deadline).toBe("2026-11-12");
    expect(job.location).toBe("Hà Nội");
    expect(job.description).toBeTruthy();
    expect(job.description).not.toMatch(/<[a-z]/i);
    expect(job.address).not.toContain("Not Available");
  });
});

describe("ITviec CLI validation (no network)", () => {
  test("unknown flag exits 1 with UNKNOWN_FLAG", async () => {
    const r = await runCLI(["search", "--bogus", "x"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("UNKNOWN_FLAG");
  });

  test("a city ITviec does not list exits 1 BAD_LOCATION", async () => {
    const r = await runCLI(["search", "-q", "python", "-l", "Cần Thơ"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("BAD_LOCATION");
  });

  test("bad --remote exits 1 BAD_ARG", async () => {
    const r = await runCLI(["search", "-q", "python", "--remote", "remote,hybrid"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("BAD_ARG");
  });

  for (const flag of ["jobage", "page", "limit"]) {
    test(`--${flag} fractional exits 1 with BAD_ARG`, async () => {
      const r = await runCLI(["search", "-q", "x", `--${flag}`, "0.5"]);
      expect(r.exitCode).toBe(1);
      expect(err(r.stderr).code).toBe("BAD_ARG");
    });
  }

  test("detail on a foreign host exits 1 BAD_ID", async () => {
    const r = await runCLI(["detail", "https://itviec.com.evil.io/it-jobs/x-1250"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("BAD_ID");
  });

  test("detail without id exits 1 NO_ID", async () => {
    const r = await runCLI(["detail"]);
    expect(r.exitCode).toBe(1);
    expect(err(r.stderr).code).toBe("NO_ID");
  });
});
