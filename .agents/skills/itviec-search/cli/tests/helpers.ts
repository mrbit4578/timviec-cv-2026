import { join } from "path";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const CLI_PATH = join(import.meta.dir, "../src/cli.ts");
const SEARCH_FIXTURE = join(import.meta.dir, "fixtures/search.html");
const DETAIL_FIXTURE = join(import.meta.dir, "fixtures/detail.html");

export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCLI(args: string[], preload?: string): Promise<CLIResult> {
  const proc = Bun.spawn(["bun", "run", ...(preload ? ["--preload", preload] : []), CLI_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

/**
 * Run the real CLI against a local server serving saved pages, never the
 * network: `/it-jobs/<slug ending in digits>` gets the detail fixture, any
 * other `/it-jobs/...` path the search fixture, and a path containing
 * `not-a-term` ITviec's 404. Returns the request URLs the CLI built.
 */
export async function runWithFixture(args: string[]): Promise<{ result: CLIResult; requests: URL[] }> {
  const requests: URL[] = [];
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      requests.push(url);
      if (url.pathname.includes("not-a-term")) return new Response("Search term not found", { status: 404 });
      const file = /\/it-jobs\/[a-z0-9-]+-\d+$/.test(url.pathname) ? DETAIL_FIXTURE : SEARCH_FIXTURE;
      return new Response(Bun.file(file), { headers: { "Content-Type": "text/html" } });
    },
  });
  const dir = mkdtempSync(join(tmpdir(), "itviec-fixture-"));
  const preload = join(dir, "fetch.ts");
  writeFileSync(preload, `
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.origin !== "https://itviec.com" || !url.pathname.startsWith("/it-jobs")) {
        throw new Error("Unexpected request in offline test: " + url.href);
      }
      return originalFetch(${JSON.stringify(server.url.origin)} + url.pathname + url.search, init);
    };
  `);
  try {
    const result = await runCLI(args, preload);
    // Report the URL the CLI asked for, on the real host.
    return { result, requests: requests.map((u) => new URL(u.pathname + u.search, "https://itviec.com")) };
  } finally {
    server.stop(true);
    rmSync(dir, { recursive: true, force: true });
  }
}

export function parseJSON<T = unknown>(result: CLIResult): T {
  if (result.exitCode !== 0) {
    throw new Error(`CLI exited with code ${result.exitCode}. stderr: ${result.stderr}`);
  }
  return JSON.parse(result.stdout) as T;
}
