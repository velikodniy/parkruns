import { assertEquals } from "@std/assert";
import { writeTextFileAtomic } from "./fs.ts";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir();
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("writeTextFileAtomic - writes content readable in full", async () => {
  await withTempDir(async (dir) => {
    const path = `${dir}/data.json`;
    await writeTextFileAtomic(path, '{"a":1}');
    assertEquals(await Deno.readTextFile(path), '{"a":1}');
  });
});

Deno.test("writeTextFileAtomic - creates missing parent directories", async () => {
  await withTempDir(async (dir) => {
    const path = `${dir}/nested/deeper/data.json`;
    await writeTextFileAtomic(path, "hello");
    assertEquals(await Deno.readTextFile(path), "hello");
  });
});

Deno.test("writeTextFileAtomic - overwrites an existing file", async () => {
  await withTempDir(async (dir) => {
    const path = `${dir}/data.json`;
    await Deno.writeTextFile(path, "old");
    await writeTextFileAtomic(path, "new");
    assertEquals(await Deno.readTextFile(path), "new");
  });
});

Deno.test("writeTextFileAtomic - leaves no temp files behind", async () => {
  await withTempDir(async (dir) => {
    await writeTextFileAtomic(`${dir}/data.json`, "x");
    const entries = [...Deno.readDirSync(dir)].map((e) => e.name);
    assertEquals(entries, ["data.json"]);
  });
});
