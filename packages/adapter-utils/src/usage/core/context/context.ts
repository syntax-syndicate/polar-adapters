export type Middleware<T> = (ctx: T) => Promise<void>;

export class Context<T> {
	/** The middlewares to run */
	private middlewares: Middleware<T>[] = [];

	/**
	 * Adds a middleware to the chain.
	 * @param middleware - The middleware to add.
	 * @returns The context object.
	 */
	public pipe(middleware: Middleware<T>) {
		this.middlewares.push(middleware);

		return this;
	}

	/**
	 * Runs the middleware chain.
	 * @param ctx - The context object.
	 */
	public async run(ctx: T) {
		await Promise.all(this.middlewares.map((middleware) => middleware(ctx)));
	}
}
