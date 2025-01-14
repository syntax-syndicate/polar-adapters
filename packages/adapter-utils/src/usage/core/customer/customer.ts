import type { LanguageModelV1 } from "@ai-sdk/provider";
import { LLMMeter } from "../../meters/llm/llm";
import { StorageMeter } from "../../meters/storage/storage";

export class CustomerResolver<TRequest> {
	/** The customer ID resolver */
	public getCustomerId?: (req: TRequest) => Promise<string> | undefined;

	constructor(getCustomerId: (req: TRequest) => Promise<string>) {
		this.getCustomerId = getCustomerId;
	}

	/**
	 * Creates a language model meter tied to the customer.
	 * @param model - The language model to meter.
	 * @returns The language model meter.
	 */
	public model(model: LanguageModelV1) {
		return new LLMMeter<TRequest>(this, model);
	}

	/**
	 * Creates a storage meter tied to the customer.
	 * @returns The storage meter.
	 */
	public storage() {
		return new StorageMeter<TRequest>(this);
	}
}
