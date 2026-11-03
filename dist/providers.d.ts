import { type Questions } from '@typesafe-ai/sdk';
import { type BrandRequest, type Evaluation } from './core.js';
export interface EvaluationOptions {
    apiKey: string;
    signal: AbortSignal;
    variant?: 'A' | 'B';
    fetcher?: typeof fetch;
}
export declare function requestInstructions(input: BrandRequest, variant?: 'A' | 'B'): {
    model: string;
    input: string;
    questions: {
        name: string;
        instructions: string;
        choices: {
            value: string;
            description: string;
        }[];
        type: string;
    }[];
    state?: undefined;
} | {
    model: string;
    state: {
        post: string;
        purpose: string;
        author_context: string;
        scope: string;
    };
    questions: Questions;
    input?: undefined;
};
export declare function evaluate(input: BrandRequest, options: EvaluationOptions): Promise<Evaluation>;
