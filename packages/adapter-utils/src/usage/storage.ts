import { put } from "@vercel/blob";
import { Meter, MeterContext } from "./meter";
import { CustomerContext } from "./usage";

interface StorageMeterContext extends MeterContext {
	usage: {
		bytes: number;
	};
}

type Uploader = typeof put;
export class StorageMeter<TRequest> {
    private meter: Meter<StorageMeterContext>;
    private client: Uploader;
    private customerContext: CustomerContext<TRequest>;

    constructor(customerContext: CustomerContext<TRequest>, client: Uploader) {
        this.customerContext = customerContext;
        this.client = client;
        this.meter = new Meter<StorageMeterContext>();
    }

    public increment(
		meter: string,
		transformer: (ctx: StorageMeterContext) => number,
	) {
		this.meter.increment(meter, transformer);

		return this;
	}

    public handler<TResponse>(callback: (req: TRequest, res: TResponse, client: Uploader) => Promise<TResponse>) {
        return async (req: TRequest, res: TResponse) => {
            const client = await this.wrapClient(this.client, req);
            
            return callback(req, res, client);
        }
    }

    private async wrapClient(client: Uploader, req: TRequest): Promise<Uploader> {
        const meter = await this.createMeterHandler();

        return this.createMeteredPut(meter, this.customerContext);
    }

    private async createMeterHandler() {
		return async (context: StorageMeterContext) => {
			await this.meter.run(context);
		};
	}

    private createMeteredPut(meter: (context: StorageMeterContext) => Promise<void>, customerContext: CustomerContext<any>): typeof put {
        return async (pathname, body, optionsInput) => {
            const transformStream = new TransformStream<Uint8Array, Uint8Array>({
                transform: async (chunk, controller) => {
                    await meter({
                        usage: {
                            bytes: chunk.length,
                        },
                        customerId: (await customerContext.getCustomerId?.(optionsInput)) ?? "",
                    });
                    controller.enqueue(chunk);
                },
            });

            const meteredBody = body instanceof ReadableStream
                ? body.pipeThrough(transformStream)
                : new ReadableStream({
                    start(controller) {
                        if (body instanceof Uint8Array) {
                            controller.enqueue(body);
                        } else if (typeof body === 'string') {
                            controller.enqueue(new TextEncoder().encode(body));
                        }
                        controller.close();
                    }
                }).pipeThrough(transformStream);

            return put(pathname, meteredBody, optionsInput);
        };
    }
}