import { describe, expect, it } from "vitest";
import { Usage } from "./usage";
import { CustomerResolver } from "./customer/customer";

describe("Usage", () => {
    it("should get customer id", async () => {
        const customerResolver = Usage((req: any) => Promise.resolve("123"));

        expect(customerResolver).toBeInstanceOf(CustomerResolver);
        expect(customerResolver.getCustomerId).toBeDefined();
        expect(customerResolver.getCustomerId).toBeDefined();
    })
})