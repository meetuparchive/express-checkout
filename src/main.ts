import { setFailed, debug } from "@actions/core";
import { context } from "@actions/github";
import { exec } from "@actions/exec";
import { env } from "process";
import { existsSync } from "fs";
import { join } from "path";
import execa from "execa";

type Env = { [key: string]: string | undefined };
type Repo = { owner: string; repo: string };

interface Config {
  checkout: Checkout;
  repo: Repo;
  branch: string;
  ref: string;
  maxDepth: number;
}

interface Context {
  repo: Repo;
  sha: string;
}

export const extract = (env: Env, context: Context): Config => {
  const branch = (env.GITHUB_REF || "").split("/")[2];
  const checkout = new GitCheckout(env.GITHUB_TOKEN || "");
  const repo = context.repo;
  const ref = context.sha;
  const maxDepth = parseInt(env.INPUT_MAX_DEPTH || "100");
  return {
    checkout,
    repo,
    branch,
    ref,
    maxDepth
  };
};

interface Checkout {
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

const run = async (): Promise<void> => {
  try {
    const { checkout, repo, branch, ref, maxDepth } = extract(env, context);
    const status = await checkout.checkout(repo, branch, ref, maxDepth);
    if (status > 0) {
      throw new Error(
        `Failed to checkout ${repo.owner}/${repo.repo}@${branch}`
      );
    }
  } catch (error) {
    setFailed(`⚠️ ${error.message}`);
  }
};

run();

export default run;
