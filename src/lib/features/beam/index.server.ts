import { getOctoApp, octo } from "$lib/common/octo.server";
import type { Octokit } from "octokit";
import { exec } from 'node:child_process';
import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

type Version = `${number}.${number}.${number}`;

// TODO: add type for octokit
export const createBeam = async({ general_octokit, version }: { general_octokit: Octokit , version: Version}) => {
    //add everything in .dist/beam as a new commit to Bling-Services/beam
    
    // Get the repository information
    //TODO: swap with bling beam
    const owner = 'HannesGitH';
    const repo = 'beam2';

    //TODO: should be GET /orgs/{org}/installation with org = Bling-Services
    const installationId = (await general_octokit.request('GET /users/{owner}/installation', {
        owner,
        repo,
    })).data.id;

    const octokit = await octo(installationId);

    const { data: {token: accessToken} } = await octokit.request('POST /app/installations/{installation_id}/access_tokens', {
        installation_id: installationId,
    });

    pushBeam({version, owner, repo, accessToken});
}

// Helper function to read files recursively
async function readFilesRecursively(dir: string): Promise<{ path: string }[]> {
    const files: { path: string }[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
            const subFiles = await readFilesRecursively(fullPath);
            files.push(...subFiles);
        } else {
            files.push({ path: fullPath });
        }
    }
    
    return files;
}

// XXX: should not be exported..
export const genBeam = async ({version}:{version: Version}) => {
    // run sh script to generate beam
    const { stdout } = await execPromise(`beam_gen api.dev.blingcard.app ${version}`);
}


export const pushBeam = async ({version, owner, repo, accessToken}:{version: Version, owner: string, repo: string, accessToken: string}) => {
    // run sh script to push beam
    const { stdout } = await execPromise(`GITHUB_TOKEN=${accessToken} beam_push ${version} ${owner} ${repo}`);
    // get hash from result (read stdout)
    const hash = stdout.split(' ')[1];
    return hash;
}

