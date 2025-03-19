import { octo_app } from "$lib/common/octo.server";
import { onPullRequest } from "$lib/hooks";

octo_app.webhooks.on("pull_request", onPullRequest);

export async function POST({ request }) : Promise<void> {
	octo_app.webhooks.verifyAndReceive({
		id: request.headers.get("x-github-delivery")!,
		name: request.headers.get("x-github-event")!,
        signature: request.headers.get("x-hub-signature-256")!,
		payload: await request.json(),
	});
}
