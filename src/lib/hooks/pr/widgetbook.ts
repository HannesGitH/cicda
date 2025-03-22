import { env } from "$env/dynamic/private";
import fs from "node:fs";
import type { Octokit } from "octokit";
import { artifact_dir, servable_files_dir } from "../../../../config";
import { exec } from 'node:child_process';
import { promisify } from 'util';
import path from "node:path";

const writeFilePromise = promisify(fs.writeFile);

export const buildWidgetBookFromHook = async({ octokit, payload }: { octokit: Octokit, payload: any }) => {
    // ignore prs from bots
    if (payload.pull_request.user.type === "Bot") {
        return;
    }

    // only run if the head changed (synchronize action)
    if (payload.action !== "synchronize" && payload.action !== "opened" && payload.action !== "reopened") {
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

    // download the pr source code as zip
    const zipResponse = await octokit.rest.repos.downloadZipballArchive({
        owner: head.owner,
        repo: head.repo,
        ref: payload.pull_request.head.ref
    });

    // save the zip to a file
    const zipPath = `${artifact_dir}/source/widgetbook/${prId}.zip`;
    const buffer = await new Response(zipResponse.data as ReadableStream).arrayBuffer();
    // Ensure directory exists before writing file
    const zipDir = path.dirname(zipPath);
    if (!fs.existsSync(zipDir)) {
        fs.mkdirSync(zipDir, { recursive: true });
    }
    await writeFilePromise(zipPath, Buffer.from(buffer));

    // build the widgetbook
    const buildOutputDir = `${servable_files_dir}/${baseHref}`;
    const command = `widgetbook_build ${baseHref} ${zipPath} 'packages/ui' ${buildOutputDir}`;
    console.log(`Building widgetbook with command: ${command}`);
    const build_process = exec(command);

    build_process.stdout?.on('data', (data) => {
        console.log(data);
    });

    build_process.stderr?.on('data', (data) => {
        console.error(data);
    });

    build_process.on('close', (code) => {
        console.log(`widgetbook build finished with code ${code}`);
    });
};