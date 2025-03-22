import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createBeam, genBeam } from '$lib/features/beam/index.server';
import { getOctoApp } from '$lib/common/octo.server';

export const POST: RequestHandler = async ({ request }) => {
    console.log('test request received');
	const result = await createBeam({
        version: "0.0.6",
        general_octokit: (await getOctoApp()).octokit
    });
    return json({
        message: result
    });
};
