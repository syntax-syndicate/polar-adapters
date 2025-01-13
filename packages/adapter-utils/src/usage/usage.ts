import { put } from '@vercel/blob'

import { LanguageModelV1 } from "@ai-sdk/provider";
import { LLMMeter } from "./llm";
import { StorageMeter } from './storage';

export class Usage<TRequest> {
	public customer(callback: (req: TRequest) => Promise<string>) {
		return new CustomerContext<TRequest>(callback);
	}
}


export class CustomerContext<TRequest> {
	public getCustomerId?: (req: TRequest) => Promise<string> | undefined;

    constructor(getCustomerId: (req: TRequest) => Promise<string>) {
        this.getCustomerId = getCustomerId;
    }

	public model(model: LanguageModelV1) {
		return new LLMMeter<TRequest>(this, model);
	}

    public storage(client: typeof put) {
        return new StorageMeter<TRequest>(this, client);
    }
}