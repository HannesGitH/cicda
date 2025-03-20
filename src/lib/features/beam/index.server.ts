import { getOctoApp } from "$lib/common/octo.server";
import type { Octokit } from "octokit";
import { exec } from 'node:child_process';

type Version = `${number}.${number}.${number}`;

// TODO: add type for octokit
export const createBeam = async({ octokit, version }: { octokit: Octokit | any, version: Version}) => {
    
};

// XXX: should not be exported..
export const genBeam = async ({version}:{version: Version}) => {
    // run sh script to generate beam
    const result = await exec(`beam_gen api.dev.blingcard.app ${version}`);
    console.log(result);
    return result;
}