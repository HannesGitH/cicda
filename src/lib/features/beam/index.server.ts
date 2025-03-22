import { getOctoApp, octo } from "$lib/common/octo.server";
import type { Octokit } from "octokit";
import { exec } from 'node:child_process';
import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { promisify } from 'util';
import yaml from 'yaml';

const execPromise = promisify(exec);

type Version = `${number}.${number}.${number}`;

// TODO: add type for octokit
export const createBeam = async({ general_octokit, version }: { general_octokit: Octokit , version: Version}) => {
    //add everything in .dist/beam as a new commit to Bling-Services/beam

    console.log('Creating beam');
    
    // Get the repository information
    //TODO: swap with bling beam
    const owner = 'HannesGitH';
    const beam_repo = 'beam2';
    const app_repo = 'bling_app';
    const app_branch = 'dev';

    await genBeam({version});

    console.log('Beam generated');

    //TODO: should be GET /orgs/{org}/installation with org = Bling-Services
    const installationId = (await general_octokit.request('GET /users/{owner}/installation', {
        owner,
        repo: beam_repo,
    })).data.id;

    const octokit = await octo(installationId);

    const { data: {token: accessToken} } = await octokit.request('POST /app/installations/{installation_id}/access_tokens', {
        installation_id: installationId,
    });

    const hash = await pushBeam({version, owner, repo: beam_repo, accessToken});
    const pr = await makeBeamPr({hash, owner, repo: app_repo, branch: app_branch, octokit, link: `https://github.com/${owner}/${beam_repo}/commit/${hash}`});

    console.log('Beam pushed and PR created');
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
    const hash = stdout.split('\n').at(-2);
    return hash ?? ''; // Add null coalescing to ensure string return type
}

export const makeBeamPr = async ({hash, owner, repo, branch, octokit, link}:{hash: string, owner: string, repo: string, branch: string, octokit: Octokit, link: string}) => {
    // change app/pubspec.yaml in owner/repo to use the new hash
    
    try {
        // 1. Get the current pubspec.yaml file content
        const { data: fileData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: 'app/pubspec.yaml',
            branch,
        });

        // 2. Decode the content
        // Add type guard to ensure we're working with a file object, not an array
        if (Array.isArray(fileData) || !('content' in fileData)) {
            throw new Error('Expected a file object, but received a directory listing or wrong format');
        }
        
        const content = Buffer.from(fileData.content, 'base64').toString();
        
        // 3. Parse the YAML dependencies.beam.git.ref = hash in place while preserving comments
        const doc = yaml.parseDocument(content);
        // Update the beam git reference
        doc.setIn(['dependencies', 'beam', 'git', 'ref'], hash);
        // Convert back to string, preserving comments
        const updatedContent = doc.toString();
        
        // 4. Create a new branch for this change
        const branchName = `update-beam-ref-${hash.substring(0, 7)}`;
        
        // Get the SHA of the latest commit on the branch to create our new branch
        const { data: refData } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
            owner,
            repo,
            ref: `heads/${branch}`,
        });
        const baseSha = refData.object.sha;
        
        // Create a new branch
        await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
        });
        
        // 5. Create a commit with the updated content
        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path: 'app/pubspec.yaml',
            message: `Update beam reference to ${hash.substring(0, 7)}`,
            content: Buffer.from(updatedContent).toString('base64'),
            sha: fileData.sha,
            branch: branchName,
        });
        
        // 6. Create a pull request
        const { data: pullRequest } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
            owner,
            repo,
            title: `🛸 Update beam reference to ${hash.substring(0, 7)}`,
            body: `This PR updates the beam reference to the latest version.\n\nFor more information see [changes](${link})`,
            head: branchName,
            base: branch,
        });
        
        return pullRequest;
    } catch (error) {
        console.error('Error creating PR for beam update:', error);
        throw error;
    }
}

