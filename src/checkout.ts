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
    maxDepth: number | undefined
  ): Promise<number>;
}

export class GitCheckout implements Checkout {
  private cloneToken: string;
  constructor(cloneToken: string) {
    this.cloneToken = cloneToken;
  }

  async gitDir(): Promise<string> {
    return (await execa("git", ["rev-parse", "--git-dir"])).stdout;
  }

  cloneString(branch: string, depth: number, repoUri: string): string {
    return `git clone --single-branch --branch ${branch} --depth ${depth} https://${this.cloneToken}:x-oauth-basic@github.com/${repoUri}.git .`;
  }

  async checkout(
    repo: { owner: string; repo: string },
    branch: string,
    ref: string,
    maxDepth: number | undefined
  ): Promise<number> {
    let depth = 1;
    const repoUri = `${repo.owner}/${repo.repo}`;
    const cloneStatus = await exec(this.cloneString(branch, depth, repoUri));
    if (cloneStatus > 0) {
      const gitDir = await this.gitDir();
      while ((await exec(`git checkout -q ${ref}`)) > 0) {
        //  When repo gets to the max depth of the origin Git silenty turns it into a deep clone
        if (!existsSync(join(gitDir, "scratch"))) {
          debug("Reached checkout maximum depth");
          return 0;
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
        await exec(`git fetch --depth ${depth} origin`);
      }
    }
    return cloneStatus;
  }
}
