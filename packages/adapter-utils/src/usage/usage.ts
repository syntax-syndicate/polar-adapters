import { CustomerResolver } from "./customer/customer";

export const Usage = <TRequest>(getCustomerId: (req: TRequest) => Promise<string>) => {
	return new CustomerResolver<TRequest>(getCustomerId);
}

