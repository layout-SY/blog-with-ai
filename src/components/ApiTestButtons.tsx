"use client";

import { useState } from "react";

type TestResult = {
  status: "idle" | "loading" | "success" | "error";
  data?: unknown;
  error?: string;
  duration?: number;
};

const TEST_PAYLOADS = {
  tutorial: {
    templateType: "tutorial",
    formValues: {
      topic: "React useEffect 클린업 함수",
      targetAudience: "React 초보자",
      goalOutcome: "메모리 누수 없는 컴포넌트 작성",
      codeLanguage: "typescript",
    },
  },
  til: {
    templateType: "til",
    formValues: {
      topic: "TypeScript satisfies 연산자 활용법",
      context: "타입 추론을 유지하면서 타입 체크가 필요했던 상황",
      codeLanguage: "typescript",
    },
  },
  troubleshooting: {
    templateType: "troubleshooting",
    formValues: {
      topic: "Next.js 14 hydration mismatch 에러 해결",
      errorMessage: "Hydration failed because the initial UI does not match",
      environment: "Next.js 14.1, React 18, TypeScript 5.3",
      codeLanguage: "typescript",
    },
  },
} as const;

export function ApiTestButtons() {
  const [results, setResults] = useState<Record<string, TestResult>>({
    tutorial: { status: "idle" },
    til: { status: "idle" },
    troubleshooting: { status: "idle" },
  });

  const runTest = async (templateType: keyof typeof TEST_PAYLOADS) => {
    setResults((prev) => ({
      ...prev,
      [templateType]: { status: "loading" },
    }));

    const startTime = performance.now();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_PAYLOADS[templateType]),
      });

      const data = await response.json();
      const duration = Math.round(performance.now() - startTime);

      console.log(data)

      if (!response.ok) {
        setResults((prev) => ({
          ...prev,
          [templateType]: {
            status: "error",
            error: data.error || `HTTP ${response.status}`,
            duration,
          },
        }));
        return;
      }

      setResults((prev) => ({
        ...prev,
        [templateType]: { status: "success", data, duration },
      }));
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setResults((prev) => ({
        ...prev,
        [templateType]: {
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
          duration,
        },
      }));
    }
  };

  const runAllTests = async () => {
    for (const key of Object.keys(TEST_PAYLOADS) as Array<keyof typeof TEST_PAYLOADS>) {
      await runTest(key);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 text-white rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">API 테스트 (개발용)</h2>
        <button
          onClick={runAllTests}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium"
        >
          전체 테스트
        </button>
      </div>

      <div className="grid gap-4">
        {(Object.keys(TEST_PAYLOADS) as Array<keyof typeof TEST_PAYLOADS>).map(
          (templateType) => {
            const result = results[templateType];
            return (
              <div
                key={templateType}
                className="p-4 bg-gray-800 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{templateType}</span>
                  <button
                    onClick={() => runTest(templateType)}
                    disabled={result.status === "loading"}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
                  >
                    {result.status === "loading" ? "테스트 중..." : "테스트"}
                  </button>
                </div>

                {/* Payload Preview */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-400">
                    요청 페이로드
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-700 rounded overflow-auto">
                    {JSON.stringify(TEST_PAYLOADS[templateType], null, 2)}
                  </pre>
                </details>

                {/* Result */}
                {result.status !== "idle" && (
                  <div
                    className={`p-3 rounded text-sm ${
                      result.status === "loading"
                        ? "bg-yellow-900/50"
                        : result.status === "success"
                          ? "bg-green-900/50"
                          : "bg-red-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          result.status === "loading"
                            ? "bg-yellow-400 animate-pulse"
                            : result.status === "success"
                              ? "bg-green-400"
                              : "bg-red-400"
                        }`}
                      />
                      <span className="capitalize">{result.status}</span>
                      {result.duration && (
                        <span className="text-gray-400">
                          ({result.duration}ms)
                        </span>
                      )}
                    </div>

                    {result.error && (
                      <p className="text-red-300">{result.error}</p>
                    )}

                    {result.data != null ? (
                      <details>
                        <summary className="cursor-pointer text-gray-300">
                          응답 데이터
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-700 rounded overflow-auto max-h-64">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
