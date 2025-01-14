import type {
	LanguageModelV1,
	LanguageModelV1CallOptions,
	LanguageModelV1StreamPart,
} from "@ai-sdk/provider";
import { Meter, type MeterContext } from "../meter/meter";
import {
	experimental_wrapLanguageModel as wrapLanguageModel,
	type Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware,
} from "ai";
import { CustomerResolver } from "../customer/customer";

type Handler<TRequest, TResponse> = (
	req: TRequest,
	res: TResponse,
) => Promise<TResponse>;

interface LLMMeterContext extends MeterContext {
	usage: {
		promptTokens: number;
		completionTokens: number;
	};
}

export class LLMMeter<TRequest> {
	/** The language model */
	private model: LanguageModelV1;
	/** The meter for the language model */
	private meter: Meter<LLMMeterContext>;
	/** The customer resolver */
	private customerContext: CustomerResolver<TRequest>;

	constructor(customerContext: CustomerResolver<TRequest>, model: LanguageModelV1) {
		this.customerContext = customerContext;
		this.model = model;
		this.meter = new Meter<LLMMeterContext>();
	}

	/**
	 * Increments the usage for a specific meter.
	 * @param meter - The name of the meter to increment.
	 * @param transformer - A function that transforms the meter context into a number.
	 * @returns The meter instance.
	 */
	public increment(
		meter: string,
		transformer: (ctx: LLMMeterContext) => number,
	) {
		this.meter.increment(meter, transformer);

		return this;
	}

	/**
	 * Creates a handler function for the target framework
	 * @param callback - The callback function to wrap.
	 * @returns The wrapped handler function.
	 */
	public handler<TResponse>(
		callback: (
			req: TRequest,
			res: TResponse,
			model: LanguageModelV1,
		) => Promise<TResponse>,
	): Handler<TRequest, TResponse> {
		return async (req: TRequest, res: TResponse) => {
			const model = wrapLanguageModel({
				model: this.model,
				middleware: await this.middleware(req),
			});

			return callback(req, res, model);
		};
	}

	/**
	 * Creates a middleware object for the language model.
	 * @param req - The request object.
	 * @returns The middleware object.
	 */
	private async middleware(req: TRequest): Promise<LanguageModelV1Middleware> {
		const meter = await this.createMeterHandler();

		return {
			wrapGenerate: this.wrapGenerate(meter, req),
			wrapStream: this.wrapStream(meter, req),
		};
	}

	private async createMeterHandler() {
		return async (context: LLMMeterContext) => {
			await this.meter.run(context);
		};
	}

	/**
	 * Wraps the generate function to increment the usage meter.
	 * @param meter - The meter function to increment.
	 * @param req - The request object.
	 * @returns The wrapped generate function.
	 */
	private wrapGenerate(
		meter: (context: LLMMeterContext) => Promise<void>,
		req: TRequest,
	) {
		return async (options: {
			doGenerate: () => ReturnType<LanguageModelV1["doGenerate"]>;
			params: LanguageModelV1CallOptions;
			model: LanguageModelV1;
		}): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> => {
			const result = await options.doGenerate();

			await meter({
				usage: result.usage,
				customerId: (await this.customerContext.getCustomerId?.(req)) ?? "",
			});

			return result;
		};
	}

	/**
	 * Wraps the stream function to increment the usage meter for each chunk.
	 * @param meter - The meter function to increment.
	 * @param req - The request object.
	 * @returns The wrapped stream function.
	 */
	private wrapStream(
		meter: (context: LLMMeterContext) => Promise<void>,
		req: TRequest,
	) {
		return async ({
			doStream,
		}: {
			doStream: () => ReturnType<LanguageModelV1["doStream"]>;
		}) => {
			const { stream, ...rest } = await doStream();

			const transformStream = new TransformStream<
				LanguageModelV1StreamPart,
				LanguageModelV1StreamPart
			>({
				transform: async (chunk, controller) => {
					if (chunk.type === "finish") {
						await meter({
							usage: chunk.usage,
							customerId: (await this.customerContext.getCustomerId?.(req)) ?? "",
						});
					}

					controller.enqueue(chunk);
				},
			});

			return {
				stream: stream.pipeThrough(transformStream),
				...rest,
			};
		};
	}
}
