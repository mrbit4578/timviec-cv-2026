import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { buildSearchUrl, citySlug, htmlFetch, keywordSlug, parseJobCards, parseJobDetail, relativeToDate } from "../src/helpers";
import { normalizeSlug } from "../src/commands/detail";
import { withinDays } from "../src/commands/search";

const NOW = new Date("2026-10-22T07:00:00+07:00");
const fixture = (name: string) => readFileSync(join(import.meta.dir, "fixtures", name), "utf8");

describe("URL building", () => {
  test("keyword slugs", () => {
    expect(keywordSlug("React Native")).toBe("react-native");
    expect(keywordSlug("node.js")).toBe("nodejs");
    expect(keywordSlug("C#")).toBe("c-sharp");
    expect(keywordSlug("C++")).toBe("c-plus-plus");
    expect(keywordSlug("  Data   Engineer ")).toBe("data-engineer");
  });
  test("cities", () => {
    expect(citySlug("Hồ Chí Minh")).toBe("ho-chi-minh-hcm");
    expect(citySlug("TP HCM")).toBe("ho-chi-minh-hcm");
    expect(citySlug("ha noi")).toBe("ha-noi");
    expect(citySlug("Đà Nẵng")).toBe("da-nang");
    expect(citySlug("Hải Phòng")).toBeNull();
  });
  test("page 1 has no query string", () => {
    expect(buildSearchUrl("python", null, 1)).toBe("https://itviec.com/it-jobs/python");
    expect(buildSearchUrl(undefined, "da-nang", 3)).toBe("https://itviec.com/it-jobs/da-nang?page=3");
  });
});

describe("relative dates", () => {
  test("hours, days and weeks", () => {
    expect(relativeToDate("4 hours ago", NOW)).toBe("2026-10-22");
    expect(relativeToDate("1 day ago", NOW)).toBe("2026-10-21");
    expect(relativeToDate("2 weeks ago", NOW)).toBe("2026-10-08");
    expect(relativeToDate("a month ago", NOW)).toBe("2026-09-22");
    expect(relativeToDate("garbage", NOW)).toBeNull();
  });
});

describe("search page parsing", () => {
  test("parses both fixture cards", () => {
    const cards = parseJobCards(fixture("search.html"), NOW);
    expect(cards.map((c) => c.id)).toEqual([
      "data-engineer-sql-nosql-hadoop-python-java-vietinbank-1250",
      "digital-credit-risk-model-validation-python-r-sql-tnex-5213",
    ]);
    expect(cards[1].company).toBe("TNEX");
    expect(cards[0].date).toBe("2026-10-22");
  });
  test("a malformed card does not break the rest", () => {
    const html = "<div class='job-card broken'>nothing here</div>" + fixture("search.html");
    expect(parseJobCards(html, NOW)).toHaveLength(2);
  });
  test("withinDays keeps fresh and undated cards", () => {
    const cards = parseJobCards(fixture("search.html"), NOW);
    expect(withinDays(cards, 1, NOW)).toHaveLength(2);
    expect(withinDays([{ ...cards[0], date: "2026-01-01" }, { ...cards[1], date: null }], 14, NOW).map((c) => c.date)).toEqual([null]);
  });
});

describe("detail parsing", () => {
  test("JSON-LD fields", () => {
    const job = parseJobDetail(fixture("detail.html"), "x-1250", NOW)!;
    expect(job.title).toContain("Data Engineer");
    expect(job.skills).toContain("Hadoop");
    expect(job.employmentType).toBe("FULL_TIME");
    expect(job.isActive).toBe(true);
  });
  test("past validThrough marks closed", () => {
    const job = parseJobDetail(fixture("detail.html"), "x-1250", new Date("2027-01-01T00:00:00Z"))!;
    expect(job.isActive).toBe(false);
  });
  test("page without JobPosting is null", () => {
    expect(parseJobDetail("<html></html>", "x-1", NOW)).toBeNull();
  });
});

describe("normalizeSlug", () => {
  test("slugs and URLs", () => {
    expect(normalizeSlug("ai-engineer-forix-4550")).toBe("ai-engineer-forix-4550");
    expect(normalizeSlug("https://itviec.com/it-jobs/ai-engineer-forix-4550?x=1")).toBe("ai-engineer-forix-4550");
    expect(normalizeSlug("itviec.com/it-jobs/ai-engineer-forix-4550/content")).toBe("ai-engineer-forix-4550");
  });
  test("rejects other hosts", () => {
    expect(normalizeSlug("https://itviec.com.evil.io/it-jobs/a-1")).toBeNull();
    expect(normalizeSlug("https://evil.io/it-jobs/a-1")).toBeNull();
    expect(normalizeSlug("https://itviec.com/companies/forix")).toBeNull();
  });
});

describe("htmlFetch retry/backoff", () => {
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  });
  test("retries 503 then succeeds, with a timeout signal", async () => {
    globalThis.setTimeout = ((fn: () => void) => originalSetTimeout(fn, 0)) as unknown as typeof setTimeout;
    let calls = 0;
    let signal: AbortSignal | undefined | null;
    globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
      calls++;
      signal = init?.signal;
      return calls === 1 ? new Response("", { status: 503 }) : new Response("<html>ok</html>");
    }) as unknown as typeof fetch;
    expect(await htmlFetch("https://itviec.com/x")).toContain("ok");
    expect(calls).toBe(2);
    expect(signal).toBeInstanceOf(AbortSignal);
  });
  test("404 returns empty string without retry", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return new Response("", { status: 404 });
    }) as unknown as typeof fetch;
    expect(await htmlFetch("https://itviec.com/x")).toBe("");
    expect(calls).toBe(1);
  });
});
