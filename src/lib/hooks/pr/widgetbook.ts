import { privateEncrypt } from "node:crypto";
import type { Octokit } from "octokit";

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
    
    const prId = crypto.randomUUID();

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

};