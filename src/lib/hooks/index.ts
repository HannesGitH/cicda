import type { Octokit } from "octokit";
import { buildWidgetBookFromHook } from "./pr/widgetbook";

export const onPullRequest = async({ octokit, payload }: { octokit: Octokit, payload: any }) => {
    console.log("running onPullRequest hook");
    await buildWidgetBookFromHook({ octokit, payload });
};