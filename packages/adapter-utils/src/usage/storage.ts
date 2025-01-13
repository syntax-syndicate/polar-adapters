import { createMultipartUploader } from "@vercel/blob";
import { Meter, MeterContext } from "./meter";
import { CustomerContext } from "./usage";

interface StorageMeterContext extends MeterContext {
	usage: {
		bytes: number;
	};
}

type Uploader = Awaited<ReturnType<typeof createMultipartUploader>>;

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

    public async wrapClient(client: Uploader, req: TRequest): Promise<Uploader> {
        const meter = await this.createMeterHandler();

        const wrappedClient: Uploader = {
            ...client,
            uploadPart: async (partNumber, body) => {   




                const transformStream = new TransformStream<
				Buffer,
				Buffer
			>({
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

                const stream = body.pipeThrough(transformStream);


                const result = await client.uploadPart(partNumber, stream);

                await meter({
                    usage: {
                        bytes: result.size,
                    },
                    customerId: await this.customerContext.getCustomerId?.(req) ?? "",
                });

                return result;
            },
        }

        return wrappedClient;
    }

    private async createMeterHandler() {
		return async (context: StorageMeterContext) => {
			await this.meter.run(context);
		};
	}
}