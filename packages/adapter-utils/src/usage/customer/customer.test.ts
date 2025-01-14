import { describe, expect, test, vi } from "vitest";
import { CustomerResolver } from "./customer";
import { LanguageModelV1 } from "@ai-sdk/provider";

describe("Customer Resolver", () => {
	test("should create a language model meter", () => {
        const model = vi.fn() as unknown as LanguageModelV1;

        const customer = new CustomerResolver<any>((req) => req.customerId);
        const meter = customer.model(model); 

        expect(meter).toBeDefined();
        expect(meter.increment).toBeDefined();
        expect(meter.handler).toBeDefined();
    })
});
