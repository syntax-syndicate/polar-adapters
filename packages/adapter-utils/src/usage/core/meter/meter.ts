import { Context } from "../context/context";

export interface MeterContext {
	customerId: string;
}

export class Meter<TContext extends MeterContext> extends Context<TContext> {
	/**
	 * Fires the metering event
	 * @param ctx - The meter context
	 */
	public async meter({
		value,
		meter,
		customerId,
	}: {
		value: number;
		meter: string;
		customerId: string;
	}) {
		// Handle metering
		console.log(value, meter, customerId);
	}

	/**
	 * Increments the usage meter for a specific meter.
	 * @param meter - The name of the meter to increment.
	 * @param transformer - A function that transforms the meter context into a number.
	 * @returns The meter instance.
	 */
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
