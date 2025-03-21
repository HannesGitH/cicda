import { env } from "$env/dynamic/private";
import fs from "node:fs";
import type { Octokit } from "octokit";
import { artifact_dir } from "../../../../config";
import { exec } from 'node:child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const buildWidgetBookFromHook = async({ octokit, payload }: { octokit: Octokit, payload: any }) => {
    // ignore prs from bots
    if (payload.pull_request.user.type === "Bot") {
        return;
    }

    console.log("running widgetbook pipeline");

    const head = {
        owner: payload.pull_request.head.repo.owner.login,
        repo: payload.pull_request.head.repo.name,
    };
    
    const cloneUrl = payload.pull_request.head.repo.clone_url;

    const prNumber = payload.pull_request.number;
    const prIdData = `${payload.pull_request.head.repo.id}\n${prNumber}`;
    
    const prId = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(prIdData+env.WIDGETBOOK_NONCE))
        .then((hash) => 
            Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
        );

    const commentTag = `<!-- widgetbook-build-${prId} -->`;

    // check if there is a comment containing <widgetbook-build-${prId}>
    const comments = await octokit.rest.issues.listComments({
        owner: payload.pull_request.head.repo.owner.login,
        repo: payload.pull_request.head.repo.name,
        issue_number: prNumber,
    });
    const comment = comments.data.find((comment) => comment.body?.includes(commentTag));

    const baseHref = `/built/widgetbook/${head.owner}/${head.repo}/pr-${prNumber}/${prId}/`;
    const buildUrl = `https://cicda.h-h.win${baseHref}`;

    const commentContent = `${commentTag}\n📒 Widgetbook für diesen PR: [hier](${buildUrl})`;

    if (!comment) {
        // create a new comment
        await octokit.rest.issues.createComment({
            body: commentContent,
            owner: payload.pull_request.base.repo.owner.login,
            repo: payload.pull_request.base.repo.name,
            issue_number: prNumber,
        });
    }

    // //add auth token to clone url
    // //XXX: maybe there is a better way to do this
    // const installationId = (await octokit.request('GET /repos/{owner}/{repo}/installation', {
    //     owner: payload.pull_request.head.repo.owner.login,
    //     repo: payload.pull_request.head.repo.name,
    // })).data.id;
    
    // const { data: {token: accessToken} } = await octokit.request('POST /app/installations/{installation_id}/access_tokens', {
    //     installation_id: installationId,
    // });

    // download the pr source code as zip
    const zipResponse = await octokit.rest.repos.downloadZipballArchive({
        owner: head.owner,
        repo: head.repo,
        ref: payload.pull_request.head.ref
    });

    // save the zip to a file
    const zipPath = `${artifact_dir}/source/widgetbook/${prId}.zip`;
    const buffer = await new Response(zipResponse.data as ReadableStream).arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(buffer));

    // build the widgetbook
    const buildOutputDir = `${artifact_dir}/${baseHref}`;
    await execPromise(`widgetbook_build ${baseHref} ${zipPath} 'packages/ui' ${buildOutputDir}`);
};