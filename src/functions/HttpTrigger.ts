import { getValuesFromRequestQuery } from "@/utils/getValuesFromRequestQuery";
import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const querySchema = z.object({
	name: z.string().min(1).pipe(z.coerce.string()),
	many: z
		.string()
		.min(1)
		.transform((v) =>
			v.split(",").map(function (item) {
				return item.trim();
			})
		)
		.pipe(z.array(z.coerce.string()))
		.optional(),
	string: z.string().min(1).pipe(z.coerce.string()).optional(),
	posNumber: z.string().min(1).pipe(z.coerce.number().positive()).optional(),
	range: z.string().min(1).pipe(z.coerce.number().min(0).max(5)).optional(),
	plainDate: z
		.string()
		.min(1)
		.pipe(
			z.coerce.string().refine(
				(v) => /\d{4}-\d{2}-\d{2}/.test(v),
				(val) => ({ message: `Invalid plain date: ${val}` })
			)
		)
		.optional(),
});

export async function HttpTrigger(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	context.log(`Http function processed request for url "${request.url}"`);

	// Defined in local.settings.json
	// TODO add type safety to environment variables
	const ENVIRONMENT_VARIABLE = process.env.EXAMPLE_1;

	const rawBody = await request.text();

	const parsedRequest = getValuesFromRequestQuery(request, querySchema);

	if (!parsedRequest.success) {
		return { body: fromZodError(parsedRequest.error).message, status: 400 };
	} else {
		context.log(parsedRequest.data);
	}

	if (rawBody) {
		context.log("Raw body contents: ", rawBody);
	}

	const name = parsedRequest.data.name || ENVIRONMENT_VARIABLE || "world";

	return { body: `Hello, ${name}!`, status: 200 };
}

app.http("HttpTrigger", {
	methods: ["POST"],
	route: "hello",
	authLevel: "anonymous",
	handler: HttpTrigger,
});
