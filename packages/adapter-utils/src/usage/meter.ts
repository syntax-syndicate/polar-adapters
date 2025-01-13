import { Context } from "./context";

export interface MeterContext {
	customerId: string;
}

export class Meter<TContext extends MeterContext> extends Context<TContext> {
	public async meter({
		type,
		value,
		meter,
		customerId,
	}: {
		value: number;
		meter: string;
		customerId: string;
	}) {
		// Handle metering
	}

	public increment(meter: string, transformer: (ctx: TContext) => number) {
		return this.pipe(async (ctx) => {
			await this.meter({
				meter,
				value: transformer(ctx),
				customerId: ctx.customerId,
			});
		});
	}
}
