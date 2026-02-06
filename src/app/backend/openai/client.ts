import OpenAI from "openai";

export type OpenAIClientProvider = {
  getClient: () => OpenAI;
};

export function createOpenAIClientProvider(): OpenAIClientProvider {
  let client: OpenAI | null = null;

  return {
    getClient: () => {
      if (!client) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("MISSING_OPENAI_API_KEY");
        client = new OpenAI({ apiKey });
      }
      return client;
    },
  };
}
