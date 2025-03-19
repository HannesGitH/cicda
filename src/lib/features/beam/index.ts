import { octo_app } from "$lib/common/octo.server";
import { version } from "$service-worker";
import type { Octokit } from "octokit";
import { execSync } from "child_process";

type Version = `${number}.${number}.${number}`;

export const createBeam = async({ octokit, version }: { octokit: Octokit, version: Version}) => {
    
};

const genBeam = ({version}:{version: Version}) => {
    // run sh script to generate beam
    const result = execSync(`./genBeam.sh ${version}`);
    console.log(result);
}