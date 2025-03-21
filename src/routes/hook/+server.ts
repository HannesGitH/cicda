import { getOctoApp } from "$lib/common/octo.server";
import { onPullRequest } from "$lib/hooks";


export async function POST({ request })  {

    const octo_app = getOctoApp();

    octo_app.webhooks.on("pull_request", onPullRequest);

	try {
		await octo_app.webhooks.verifyAndReceive({
			id: request.headers.get("x-github-delivery")!,
			name: request.headers.get("x-github-event")!,
			signature: request.headers.get("x-hub-signature-256")!,
			payload: await request.json(),
		});
	} catch (error) {
		console.error(error);
		return new Response("Error", { status: 400 });
	}

	return new Response("OK");
}
