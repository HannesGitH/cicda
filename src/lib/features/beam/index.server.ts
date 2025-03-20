import { getOctoApp, octo } from "$lib/common/octo.server";
import type { Octokit } from "octokit";
import { exec } from 'node:child_process';
import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';

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
    
    // Get the latest commit to use as parent
    const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: 'heads/main',
    });
    
    const parentSha = refData.object.sha;

    console.log(installationId);
    console.log(parentSha);
    
    // Get the files from .dist/beam
    const beamDir = '.dist/beam';
    const files = await readFilesRecursively(beamDir);
    
    // Create blobs for each file
    const blobs = await Promise.all(
        files.map(async (file) => {
            const content = await readFile(file.path, 'utf8');

            const { data } = await octokit.rest.git.createBlob({
                owner,
                repo,
                content,
                encoding: 'utf8',
            });

            console.log("created blob for", file.path);
            
            return {
                path: relative(beamDir, file.path),
                mode: '100644' as const, // Regular file with correct type
                type: 'blob' as const,
                sha: data.sha,
            };
        })
    );

    console.log(blobs);
    
    // Create a tree
    const { data: treeData } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: parentSha,
        tree: blobs,
    });
    
    // Create a commit
    const { data: commitData } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: `update beam to ${version}`,
        tree: treeData.sha,
        parents: [parentSha],
        author: {
            name: 'Bling-Services CICDa',
            email: 'cicda@blingcard.com',
        },
    });
    
    // Update the reference
    await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: 'heads/main',
        sha: commitData.sha,
    });
    
    console.log('Successfully updated beam to version', version);
    return commitData;
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
    const result = await exec(`beam_gen api.dev.blingcard.app ${version}`);
    console.log(result);
    return result;
}

