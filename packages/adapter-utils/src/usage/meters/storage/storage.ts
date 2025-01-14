import { put } from "@vercel/blob";
import type { CustomerResolver } from "../../core/customer/customer";
import { Meter, type MeterContext } from "../../core/meter/meter";

interface StorageMeterContext extends MeterContext {
	usage: {
		bytes: number;
	};
}

type Uploader = typeof put;
export class StorageMeter<TRequest> {
	/** The meter for the storage meter */
	private meter: Meter<StorageMeterContext>;
	/** The customer resolver */
	private customerContext: CustomerResolver<TRequest>;

	constructor(customerContext: CustomerResolver<TRequest>) {
		this.customerContext = customerContext;
		this.meter = new Meter<StorageMeterContext>();
	}

	/**
	 * Increments the usage meter for a specific meter.
	 * @param meter - The name of the meter to increment.
	 * @param transformer - A function that transforms the meter context into a number.
	 * @returns The meter instance.
	 */
	public increment(
		meter: string,
		transformer: (ctx: StorageMeterContext) => number,
	) {
		this.meter.increment(meter, transformer);

		return this;
	}

	/**
	 * Creates a handler for a specific framework
	 * @param callback - The callback function to wrap.
	 * @returns The wrapped handler function.
	 */
	public handler<TResponse>(
		callback: (
			req: TRequest,
			res: TResponse,
			client: Uploader,
		) => Promise<TResponse>,
	) {
		return async (req: TRequest, res: TResponse) => {
			const client = await this.wrapClient(req);

			return callback(req, res, client);
		};
	}

	/**
	 * Wraps the client to increment the usage meter.
	 * @param req - The request object.
	 * @returns The wrapped client.
	 */
	private async wrapClient(req: TRequest): Promise<Uploader> {
		const meter = await this.createMeterHandler();

		return this.createMeteredPut(meter, req);
	}

	/**
	 * Creates a meter handler for the storage meter.
	 * @returns The meter handler.
	 */
	private async createMeterHandler() {
		return async (context: StorageMeterContext) => {
			await this.meter.run(context);
		};
	}

	/**
	 * Creates a metered put function.
	 * @param meter - The meter function to increment.
	 * @param req - The request object.
	 * @returns The metered put function.
	 */
	private createMeteredPut(
		meter: (context: StorageMeterContext) => Promise<void>,
		req: TRequest,
	): typeof put {
		return async (pathname, body, optionsInput) => {
			const transformStream = new TransformStream<Uint8Array, Uint8Array>({
				transform: async (chunk, controller) => {
					await meter({
						usage: {
							bytes: chunk.length,
						},
						customerId: (await this.customerContext.getCustomerId?.(req)) ?? "",
					});

					controller.enqueue(chunk);
				},
			});

			const meteredBody =
				body instanceof ReadableStream
					? body.pipeThrough(transformStream)
					: new ReadableStream({
							start(controller) {
								if (body instanceof Uint8Array) {
									controller.enqueue(body);
								} else if (typeof body === "string") {
									controller.enqueue(new TextEncoder().encode(body));
								}
								controller.close();
							},
						}).pipeThrough(transformStream);

			return put(pathname, meteredBody, optionsInput);
		};
	}
}
