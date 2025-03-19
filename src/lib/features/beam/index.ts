import { getOctoApp } from "$lib/common/octo.server";
import type { Octokit } from "octokit";
import { execSync } from 'node:child_process';

type Version = `${number}.${number}.${number}`;

export const createBeam = async({ octokit, version }: { octokit: Octokit, version: Version}) => {
    
};

const genBeam = ({version}:{version: Version}) => {
    // run sh script to generate beam
    const result = execSync(`beam_gen ${version}`);
    console.log(result);
}