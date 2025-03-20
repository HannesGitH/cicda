import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { genBeam } from '$lib/features/beam/index.server';

export const POST: RequestHandler = async ({ request }) => {
	const result = await genBeam({
        version: "0.0.1"
    });
    return json({
        message: result
    });
};
