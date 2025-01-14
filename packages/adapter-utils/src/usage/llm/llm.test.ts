import { describe, expect, test, vi } from "vitest";
import { CustomerResolver } from "../customer/customer";
import { LanguageModelV1 } from "@ai-sdk/provider";
import { LLMMeter } from "./llm";

describe("LLM Meter", () => {
    test("should create a language model meter", () => {
        const model = vi.fn() as unknown as LanguageModelV1;

        const customerResolver = new CustomerResolver<any>((req) => req.customerId);
        const meter = new LLMMeter<any>(customerResolver, model); 

        expect(meter).toBeDefined();
        expect(meter.increment).toBeDefined();
        expect(meter.handler).toBeDefined();
    })
});