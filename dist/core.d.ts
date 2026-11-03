import { z } from 'zod';
export declare const VERSION = "1.0.0";
export declare const REPOSITORY = "https://github.com/sean-sunagaku/sunagaku-brand-check";
export declare const BRAND = "\u9762\u767D\u3044\u5B9F\u8DF5\u30FB\u5B66\u3073 \u00D7 \u4ED5\u4E8B\u3067\u983C\u308C\u308B\u5C02\u9580\u6027";
export declare const providerSchema: z.ZodEnum<{
    decisions: "decisions";
    jev: "jev";
}>;
export type Provider = z.infer<typeof providerSchema>;
export declare const PROVIDERS: Record<Provider, {
    label: string;
    model: string;
}>;
export declare const purposeSchema: z.ZodEnum<{
    practice: "practice";
    work: "work";
    announcement: "announcement";
    opinion: "opinion";
    daily: "daily";
}>;
export declare const PURPOSES: Record<z.infer<typeof purposeSchema>, string>;
export declare const statusSchema: z.ZodEnum<{
    aligned: "aligned";
    clarify: "clarify";
    misaligned: "misaligned";
    not_applicable: "not_applicable";
    insufficient: "insufficient";
}>;
export type AxisStatus = z.infer<typeof statusSchema>;
export declare const LABELS: Record<AxisStatus, string>;
export declare const axisIdSchema: z.ZodEnum<{
    practice: "practice";
    expertise: "expertise";
    honesty: "honesty";
    respect: "respect";
}>;
export type AxisId = z.infer<typeof axisIdSchema>;
export interface Criterion {
    id: AxisId;
    title: string;
    description: string;
    aligned: string;
    clarify: string;
    misaligned: string;
}
export declare const CRITERIA: Criterion[];
export declare const RULES: string[];
export declare const requestSchema: z.ZodObject<{
    text: z.ZodString;
    context: z.ZodDefault<z.ZodString>;
    purpose: z.ZodDefault<z.ZodEnum<{
        practice: "practice";
        work: "work";
        announcement: "announcement";
        opinion: "opinion";
        daily: "daily";
    }>>;
    version: z.ZodString;
    provider: z.ZodEnum<{
        decisions: "decisions";
        jev: "jev";
    }>;
}, z.core.$strict>;
export type BrandRequest = z.infer<typeof requestSchema>;
export interface Question {
    name: string;
    instructions: string;
    choices: {
        value: string;
        description: string;
    }[];
}
export declare const choices: {
    value: string;
    description: string;
}[];
export declare function fragments(text: string): {
    value: string;
    description: string;
}[];
export declare function questionsFor(text: string, variant?: 'A' | 'B'): Question[];
export declare function sharedInput(input: BrandRequest): {
    post: string;
    purpose: string;
    author_context: string;
    scope: string;
};
export declare const answerSchema: z.ZodObject<{
    name: z.ZodString;
    choice: z.ZodString;
    confidence: z.ZodNumber;
    probabilities: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, z.core.$strict>;
export type Answer = z.infer<typeof answerSchema>;
export declare const evaluationSchema: z.ZodObject<{
    provider: z.ZodEnum<{
        decisions: "decisions";
        jev: "jev";
    }>;
    model: z.ZodString;
    version: z.ZodString;
    variant: z.ZodEnum<{
        A: "A";
        B: "B";
    }>;
    verdict: z.ZodEnum<{
        aligned: "aligned";
        clarify: "clarify";
        misaligned: "misaligned";
        insufficient: "insufficient";
    }>;
    axes: z.ZodArray<z.ZodObject<{
        id: z.ZodEnum<{
            practice: "practice";
            expertise: "expertise";
            honesty: "honesty";
            respect: "respect";
        }>;
        status: z.ZodEnum<{
            aligned: "aligned";
            clarify: "clarify";
            misaligned: "misaligned";
            not_applicable: "not_applicable";
            insufficient: "insufficient";
        }>;
        rawStatus: z.ZodEnum<{
            aligned: "aligned";
            clarify: "clarify";
            misaligned: "misaligned";
            not_applicable: "not_applicable";
            insufficient: "insufficient";
        }>;
        confidence: z.ZodNumber;
        evidence: z.ZodNullable<z.ZodString>;
        reason: z.ZodString;
        suggestion: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    durationMs: z.ZodNumber;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    evaluatedAt: z.ZodString;
}, z.core.$strict>;
export type Evaluation = z.infer<typeof evaluationSchema>;
export declare function validateAnswers(answers: Answer[], questions: Question[]): Answer[];
export declare function summarize(input: BrandRequest, answers: Answer[], metadata: Omit<Evaluation, 'axes' | 'verdict' | 'version' | 'provider'>): Evaluation;
