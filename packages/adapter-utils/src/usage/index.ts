import { openai } from "@ai-sdk/openai";
import { LLMUsage } from "./nextjs";

export const POST = LLMUsage(openai("gpt-4"))
	.customer(async (req) => "123")
	.increment("gpt-4-input", (ctx) => ctx.usage.promptTokens)
	.increment("gpt-4-output", (ctx) => ctx.usage.completionTokens)
	.handler(async (req, model) => {
		// Do your usual AI model stuff
	});
