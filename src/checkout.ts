import { debug } from "@actions/core";
import { exec } from "@actions/exec";
import { existsSync } from "fs";
import { join } from "path";
import execa from "execa";

export interface Checkout {
  checkout(
    repo: { owner: string; repo: string },
    branch: string,
    ref: string,
    maxDepth: number | undefined,
    destination: string
  ): Promise<number>;
}

export interface Git {
  dir(): Promise<string>;
  cloneString(
    cloneToken: string,
    branch: string,
    depth: number,
    repoUri: string,
    desitination: string
  ): string;

  clone(
    cloneToken: string,
    branch: string,
    depth: number,
    repoUri: string,
    desitination: string
  ): Promise<number>;

  checkoutRef(ref: string): Promise<number>;

  reachedFullDepth(gitDir: string): boolean;

  fetch(depth: number): Promise<number>;
}

export class DefaultGit implements Git {
  async dir(): Promise<string> {
    return (await execa("git", ["rev-parse", "--git-dir"])).stdout;
  }

  cloneString(
    cloneToken: string,
    branch: string,
    depth: number,
    repoUri: string,
    desitination: string
  ): string {
    return `git clone --single-branch --branch ${branch} --depth ${depth} https://${cloneToken}:x-oauth-basic@github.com/${repoUri}.git ${desitination}`;
  }

  clone(
    cloneToken: string,
    branch: string,
    depth: number,
    repoUri: string,
    desitination: string
  ): Promise<number> {
    return exec(
      this.cloneString(cloneToken, branch, depth, repoUri, desitination)
    );
  }

  checkoutRef(ref: string): Promise<number> {
    return exec(`git checkout -q ${ref}`);
  }

  reachedFullDepth(gitDir: string): boolean {
    return !existsSync(join(gitDir, "scratch"));
  }

  fetch(depth: number): Promise<number> {
    return exec(`git fetch --depth ${depth} origin`);
  }
}

export class GitCheckout implements Checkout {
  private cloneToken: string;
  private git: Git;
  constructor(cloneToken: string, git: Git) {
    this.cloneToken = cloneToken;
    this.git = git;
  }

  async checkout(
    repo: { owner: string; repo: string },
    branch: string,
    ref: string,
    maxDepth: number | undefined,
    desitination: string
  ): Promise<number> {
    let depth = 1;
    const repoUri = `${repo.owner}/${repo.repo}`;
    const cloneStatus = await this.git.clone(
      this.cloneToken,
      branch,
      depth,
      repoUri,
      desitination
    );
    if (cloneStatus == 0) {
      const gitDir = await this.git.dir();
      while ((await this.git.checkoutRef(ref)) > 0) {
        //  When repo gets to the max depth of the origin Git silenty turns it into a deep clone
        if (this.git.reachedFullDepth(gitDir)) {
          throw new Error("Reached checkout maximum depth");
        }
        depth += 2;
        if (maxDepth && depth > maxDepth) {
          throw new Error(
            `Exceeded max checkout depth of ${maxDepth} finding commit ${ref} in ${repoUri}@${branch}`
          );
        }
        debug(
          `🤿 Could not find ref ${ref} in ${repoUri}@${branch}. Going deeper...`
        );
        await this.git.fetch(depth);
      }
    }
    return cloneStatus;
  }
}
