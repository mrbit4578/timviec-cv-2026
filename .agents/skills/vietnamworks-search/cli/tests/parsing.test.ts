import { afterEach, describe, expect, test } from "bun:test";
import { apiPost, cityId, cleanUrl, fold, htmlToText, isoDay, parseDetail, parseSearch } from "../src/helpers";
import { normalizeId } from "../src/commands/detail";
import { withinDays } from "../src/commands/search";

describe("city resolution", () => {
  test("accents, case and prefixes are ignored", () => {
    expect(cityId("Hồ Chí Minh")).toBe(29);
    expect(cityId("ho chi minh")).toBe(29);
    expect(cityId("TP. HCM")).toBe(29);
    expect(cityId("Hà Nội")).toBe(24);
    expect(cityId("ha noi")).toBe(24);
    expect(cityId("Đà Nẵng")).toBe(17);
    expect(cityId("dn")).toBe(17);
    expect(cityId("Thừa Thiên Huế")).toBe(57);
    expect(cityId("Đồng Nai")).toBe(19);
    expect(cityId("Nhơn Trạch")).toBe(19);
    expect(cityId("Biên Hòa")).toBe(19);
    expect(cityId("bd")).toBe(11);
    expect(cityId("bn")).toBe(6);
  });
  test("unknown city is null", () => {
    expect(cityId("Paris")).toBeNull();
    expect(cityId("")).toBeNull();
  });
  test("fold strips Vietnamese diacritics including đ", () => {
    expect(fold("Đắk Lắk")).toBe("daklak");
  });
});

describe("field parsing", () => {
  test("isoDay keeps the posted calendar day", () => {
    expect(isoDay("2026-10-21T23:30:00+07:00")).toBe("2026-10-21");
    expect(isoDay(null)).toBeNull();
  });
  test("cleanUrl drops tracking query strings", () => {
    expect(cleanUrl("https://www.vietnamworks.com/a-b-123456-jv?utm_source=x", "123456")).toBe(
      "https://www.vietnamworks.com/a-b-123456-jv",
    );
  });
  test("htmlToText keeps list items and decodes entities", () => {
    expect(htmlToText("<ul><li>A &amp; B</li><li>C</li></ul>")).toBe("• A & B\n• C");
  });
  test("a malformed hit does not break the rest", () => {
    const { cards } = parseSearch({ data: [{ jobTitle: "no id" }, { jobId: 1234567, jobTitle: "OK" }] });
    expect(cards.map((c) => c.id)).toEqual(["1234567"]);
    expect(cards[0].company).toBeNull();
    expect(cards[0].location).toBeNull();
  });
  test("a past deadline marks the job closed", () => {
    const job = parseDetail(
      { jobId: 1234567, jobTitle: "T", expiredOn: "2026-01-01T23:59:59+07:00", isActive: true },
      new Date("2026-02-01T00:00:00Z"),
    );
    expect(job?.isActive).toBe(false);
  });
});

describe("withinDays", () => {
  test("drops cards older than the window and keeps unknown dates", () => {
    const now = new Date("2026-10-22T12:00:00+07:00");
    const base = { title: "t", company: null, location: null, deadline: null, salary: null, level: null, url: "u" };
    const cards = [
      { ...base, id: "1", date: "2026-10-21" },
      { ...base, id: "2", date: "2026-09-01" },
      { ...base, id: "3", date: null },
    ];
    expect(withinDays(cards, 14, now).map((c) => c.id)).toEqual(["1", "3"]);
  });
});

describe("normalizeId", () => {
  test("accepts ids and vietnamworks URLs", () => {
    expect(normalizeId("2121927")).toBe("2121927");
    expect(normalizeId("https://www.vietnamworks.com/sales-agronomist-1792571129269273139-2121927-jv")).toBe("2121927");
    expect(normalizeId("www.vietnamworks.com/brand-marketing-1791960530094712782-2119330-jd?utm=1")).toBe("2119330");
  });
  test("rejects other hosts and look-alikes", () => {
    expect(normalizeId("https://vietnamworks.com.evil.io/x-1234567-jv")).toBeNull();
    expect(normalizeId("https://evil.io@vietnamworks.com.evil.io/x-1234567-jv")).toBeNull();
    expect(normalizeId("https://itviec.com/it-jobs/x-1234567-jv")).toBeNull();
  });
});

describe("apiPost retry/backoff", () => {
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  });

  test("retries a 429 then succeeds, and passes a timeout signal", async () => {
    globalThis.setTimeout = ((fn: () => void) => originalSetTimeout(fn, 0)) as unknown as typeof setTimeout;
    let calls = 0;
    let signal: AbortSignal | undefined | null;
    globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
      calls++;
      signal = init?.signal;
      return calls === 1 ? new Response("", { status: 429 }) : Response.json({ ok: true });
    }) as unknown as typeof fetch;
    expect(await apiPost("https://ms.vietnamworks.com/x", {})).toEqual({ ok: true });
    expect(calls).toBe(2);
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  test("404 returns null without retrying", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return new Response("", { status: 404 });
    }) as unknown as typeof fetch;
    expect(await apiPost("https://ms.vietnamworks.com/x", {})).toBeNull();
    expect(calls).toBe(1);
  });
});
