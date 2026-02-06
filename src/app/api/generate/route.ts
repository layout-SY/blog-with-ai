import { NextResponse } from "next/server";
import { z } from "zod";
import { createSlotGenerator } from "@/app/backend/openai/generate";
import { createOpenAIClientProvider } from "@/app/backend/openai/client";
import { createPromptBuilder } from "@/app/backend/openai/prompts";

const TemplateTypeSchema = z.enum(["tutorial", "til", "troubleshooting"]);

const RequestSchema = z.object({
  templateType: TemplateTypeSchema,
  formValues: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { templateType, formValues } = parsed.data;

    const generator = createSlotGenerator(
      createOpenAIClientProvider(),
      createPromptBuilder()
    );
    const result = await generator.generate({ templateType, formValues });

    if (!result.raw) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_EMPTY_OUTPUT", responseId: result.responseId },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        templateType,
        data: result.data,
        raw: result.raw,
        responseId: result.responseId,
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const err = e as {
      message?: string;
      issues?: unknown;
      raw?: string;
      responseId?: string;
      cause?: unknown;
    };
    if (err?.message === "OPENAI_OUTPUT_NOT_JSON") {
      return NextResponse.json(
        { ok: false, error: "OPENAI_OUTPUT_NOT_JSON" },
        { status: 502 }
      );
    }
    if (err?.message === "OPENAI_OUTPUT_SCHEMA_MISMATCH") {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_OUTPUT_SCHEMA_MISMATCH",
          issues: err.issues,
          raw: err.raw,
          responseId: err.responseId,
        },
        { status: 502 }
      );
    }
    if (err?.message === "OPENAI_API_ERROR") {
      const causeMessage =
        err.cause instanceof Error ? err.cause.message : String(err.cause ?? "");
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_API_ERROR",
          detail: causeMessage || "OpenAI API 호출 실패",
        },
        { status: 502 }
      );
    }

    const detail =
      process.env.NODE_ENV === "development" && err?.message
        ? err.message
        : undefined;
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", ...(detail && { detail }) },
      { status: 500 }
    );
  }
}
