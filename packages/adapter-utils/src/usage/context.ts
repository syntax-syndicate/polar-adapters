export type Middleware<T> = (ctx: T) => Promise<void>;

export class Context<T> {
	middlewares: Middleware<T>[] = [];

	public pipe(middleware: Middleware<T>) {
		this.middlewares.push(middleware);

		return this;
	}

	public async run(ctx: T) {
		await Promise.all(this.middlewares.map((middleware) => middleware(ctx)));
	}
}
