import React from 'react';
import { z } from 'zod';
export declare const reportSchema: z.ZodObject<{
    generatedAt: z.ZodNullable<z.ZodString>;
    version: z.ZodString;
    commit: z.ZodString;
    kind: z.ZodLiteral<"live-api">;
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        purpose: z.ZodEnum<{
            practice: "practice";
            work: "work";
            announcement: "announcement";
            opinion: "opinion";
            daily: "daily";
        }>;
        expected: z.ZodString;
        provider: z.ZodEnum<{
            decisions: "decisions";
            jev: "jev";
        }>;
        variant: z.ZodEnum<{
            A: "A";
            B: "B";
        }>;
        status: z.ZodEnum<{
            error: "error";
            success: "success";
            unavailable: "unavailable";
        }>;
        evaluation: z.ZodOptional<z.ZodObject<{
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
        }, z.core.$strict>>;
        error: z.ZodOptional<z.ZodString>;
        inputHash: z.ZodString;
        promptHash: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Report = z.infer<typeof reportSchema>;
export declare function BrandCheck({ endpoint, report, initialView }: {
    endpoint?: string;
    report?: Report;
    initialView?: 'check' | 'criteria' | 'reports';
}): React.JSX.Element;
