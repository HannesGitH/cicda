import type { Octokit } from "octokit";

export const onPullRequest = async({ octokit, payload }: { octokit: Octokit, payload: any }) => {
    console.log(payload);
};