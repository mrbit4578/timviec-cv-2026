import { join } from "path";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const CLI_PATH = join(import.meta.dir, "../src/cli.ts");
export const FIXTURE = join(import.meta.dir, "fixtures/search.json");

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
 * Run the real CLI against a local server that answers every API call with the
 * saved fixture, so tests never touch the network. Returns the request bodies
 * the CLI sent, so a test can assert on the filters it built.
 */
export async function runWithFixture(args: string[]): Promise<{ result: CLIResult; bodies: any[] }> {
  const bodies: any[] = [];
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      bodies.push(await request.json());
      return new Response(Bun.file(FIXTURE), { headers: { "Content-Type": "application/json" } });
    },
  });
  const dir = mkdtempSync(join(tmpdir(), "vnw-fixture-"));
  const preload = join(dir, "fetch.ts");
  writeFileSync(preload, `
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.origin !== "https://ms.vietnamworks.com" || url.pathname !== "/job-search/v1.0/search") {
        throw new Error("Unexpected request in offline test: " + url.href);
      }
      return originalFetch(${JSON.stringify(server.url.origin)} + url.pathname, init);
    };
  `);
  try {
    return { result: await runCLI(args, preload), bodies };
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
