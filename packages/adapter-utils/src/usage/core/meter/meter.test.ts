import { expect, test, vi } from "vitest";
import { Meter } from "./meter";

test("Polestar", async () => {
	const polestar = new Meter<{
		customerId: string;
		usage: { promptTokens: number; completionTokens: number };
	}>();

	const incrementUsage = vi.fn(() => 1);
	const logEvent = vi.fn();

	await polestar
		.increment("input", incrementUsage)
		.pipe(logEvent)
		.run({
			customerId: "123",
			usage: { promptTokens: 100, completionTokens: 100 },
		});

	const expectedUsage = {
		customerId: "123",
		usage: { promptTokens: 100, completionTokens: 100 },
	};

	expect(incrementUsage).toHaveBeenCalledWith(expectedUsage);
	expect(logEvent).toHaveBeenCalledWith(expectedUsage);
});
