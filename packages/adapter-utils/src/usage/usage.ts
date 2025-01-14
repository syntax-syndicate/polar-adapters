import { CustomerResolver } from "./core/customer/customer";

export const Usage = <TRequest>(
	getCustomerId: (req: TRequest) => Promise<string>,
) => {
	return new CustomerResolver<TRequest>(getCustomerId);
};
