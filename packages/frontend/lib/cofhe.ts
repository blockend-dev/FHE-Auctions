

let _client: import("@cofhe/sdk").CofheClient | null = null;

export async function getCofheClient() {
  if (typeof window === "undefined") return null;
  if (_client) return _client;

  const { createCofheConfig, createCofheClient } = await import("@cofhe/sdk/web");
  const { chains } = await import("@cofhe/sdk/chains");

  const config = createCofheConfig({
    supportedChains: [chains.arbSepolia],
    useWorkers: true,
  });

  _client = createCofheClient(config);
  return _client;
}
