export type TemplateType = "tutorial" | "til" | "troubleshooting";

export type GenerateResult<T> = {
  data: T;
  raw: string;
  responseId: string;
};

export type GenerateParams = {
  templateType: TemplateType;
  formValues: Record<string, unknown>;
};
