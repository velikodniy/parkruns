import { assertEquals } from "@std/assert";
import { z } from "zod";
import { JsonCache } from "./cache.ts";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir();
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("JsonCache ignores invalid cached values", async () => {
  await withTempDir(async (directory) => {
    await Deno.writeTextFile(
      `${directory}/values.json`,
      JSON.stringify({ valid: "value", invalid: null }),
    );
    const cache = new JsonCache<string>("values.json", {
      directory,
      schema: z.string(),
    });

    assertEquals(await cache.load(), new Map([["valid", "value"]]));
  });
});

Deno.test("JsonCache retries keys omitted after a transient failure", async () => {
  await withTempDir(async (directory) => {
    const cache = new JsonCache<string>("values.json", {
      directory,
      schema: z.string(),
    });
    let fetches = 0;

    await cache.resolve(["missing"], () => {
      fetches++;
      return Promise.resolve(new Map());
    });
    const resolved = await cache.resolve(["missing"], () => {
      fetches++;
      return Promise.resolve(new Map([["missing", "recovered"]]));
    });

    assertEquals(fetches, 2);
    assertEquals(resolved.get("missing"), "recovered");
  });
});

Deno.test("JsonCache retains parsed schema output", async () => {
  await withTempDir(async (directory) => {
    await Deno.writeTextFile(
      `${directory}/values.json`,
      JSON.stringify({ key: " value " }),
    );
    const cache = new JsonCache<string>("values.json", {
      directory,
      schema: z.string().transform((value) => value.trim()),
    });

    assertEquals(await cache.load(), new Map([["key", "value"]]));
  });
});
