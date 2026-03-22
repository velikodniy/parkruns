const CACHE_DIR = ".cache";

export class JsonCache<T> {
  private path: string;

  constructor(filename: string) {
    this.path = `${CACHE_DIR}/${filename}`;
  }

  async load(): Promise<Map<string, T>> {
    try {
      const text = await Deno.readTextFile(this.path);
      return new Map(Object.entries(JSON.parse(text)));
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) throw e;
      return new Map();
    }
  }

  async save(data: Map<string, T>): Promise<void> {
    await Deno.mkdir(CACHE_DIR, { recursive: true });
    const obj = Object.fromEntries(data);
    await Deno.writeTextFile(this.path, JSON.stringify(obj, null, 2) + "\n");
  }

  async resolve(
    keys: string[],
    fetchMissing: (keys: string[]) => Promise<Map<string, T>>,
  ): Promise<Map<string, T>> {
    const cached = await this.load();
    const missing = keys.filter((k) => !cached.has(k));

    if (missing.length > 0) {
      const fetched = await fetchMissing(missing);
      for (const [k, v] of fetched) cached.set(k, v);
      await this.save(cached);
    }

    return cached;
  }
}
