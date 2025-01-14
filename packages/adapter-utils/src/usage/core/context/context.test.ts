import { expect, test, vi } from "vitest";
import { Context } from "./context";

test("Polestar", async () => {
	const context = new Context();

	const incrementUsage = vi.fn();
	const decrementUsage = vi.fn();
	const setUsage = vi.fn();
	const logEvent = vi.fn();

	await context
		.pipe(incrementUsage)
		.pipe(decrementUsage)
		.pipe(setUsage)
		.pipe(logEvent)
		.run({ usage: { promptTokens: 100, completionTokens: 100 } });

	const expectedUsage = { usage: { promptTokens: 100, completionTokens: 100 } };

	expect(incrementUsage).toHaveBeenCalledWith(expectedUsage);
	expect(decrementUsage).toHaveBeenCalledWith(expectedUsage);
	expect(setUsage).toHaveBeenCalledWith(expectedUsage);
	expect(logEvent).toHaveBeenCalledWith(expectedUsage);
});
