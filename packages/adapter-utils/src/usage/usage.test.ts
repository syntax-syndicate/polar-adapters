import { describe, expect, it } from "vitest";
import { CustomerResolver } from "./core/customer/customer";
import { Usage } from "./usage";

describe("Usage", () => {
	it("should get customer id", async () => {
		const customerResolver = Usage((req: any) => Promise.resolve("123"));

		expect(customerResolver).toBeInstanceOf(CustomerResolver);
		expect(customerResolver.getCustomerId).toBeDefined();
		expect(customerResolver.getCustomerId).toBeDefined();
	});
});
