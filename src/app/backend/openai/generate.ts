import type { GenerateParams, GenerateResult } from "@/shared/generate/types";
import type { OpenAIClientProvider } from "./client";
import type { PromptBuilder } from "./prompts";

/** OpenAI Responses API 응답에서 텍스트 추출용 최소 타입 */
interface ResponseLike {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}

const EMPTY_RESULT: GenerateResult<null> = {
  data: null,
  raw: "",
  responseId: "",
};

export function createSlotGenerator(
  clientProvider: OpenAIClientProvider,
  promptBuilder: PromptBuilder,
) {
  const extractOutputText = (res: ResponseLike): string => {
    const direct =
      typeof res?.output_text === "string" ? res.output_text.trim() : "";
    if (direct) return direct;
    const fromOutput = (res?.output ?? [])
      .flatMap((o) => o.content ?? [])
      .filter((c) => c?.type === "output_text" || c?.type === "text")
      .map((c) => c?.text ?? "")
      .join("");
    return fromOutput.trim();
  };

  return {
    generate: async (params: GenerateParams): Promise<GenerateResult<unknown>> => {
      const client = clientProvider.getClient();
      const { templateType, formValues } = params;
      const promptPayload = { templateType, ...formValues };

      let res;
      try {
        res = await client.responses.create({
          model: "gpt-4o-mini",
          input: promptBuilder.getPromptBundle(templateType, promptPayload),
          text: { format: { type: "json_object" } },
        });
      } catch (err) {
        const apiErr = new Error("OPENAI_API_ERROR") as Error & { cause?: unknown };
        apiErr.cause = err;
        throw apiErr;
      }

      const raw = extractOutputText(res as ResponseLike);
      const responseId = String(res?.id ?? "");

      if (!raw) {
        return { ...EMPTY_RESULT, responseId };
      }

      const json = JSON.parse(raw);

      return {
        data: json,
        raw,
        responseId,
      };
    },
  };
}

export type { GenerateParams, GenerateResult };
