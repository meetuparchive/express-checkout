import { setFailed, debug } from "@actions/core";
import { context } from "@actions/github";
import { exec } from "@actions/exec";
import { env } from "process";
import { existsSync } from "fs";
import { join } from "path";

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

class GitCheckout implements Checkout {
  private cloneToken: string;
  constructor(cloneToken: string) {
    this.cloneToken = cloneToken;
  }
  async checkout(
    repo: { owner: string; repo: string },
    branch: string,
    ref: string,
    maxDepth: number | undefined
  ): Promise<number> {
    const cloneStatus = await exec(
      `git clone --single-branch --branch ${branch} --depth 1 https://${this.cloneToken}:x-oauth-basic@github.com/${repo.owner}/${repo.repo}.git .`
    );
    if (cloneStatus > 0) {
      //const gitDir = await exec(`git rev-parse --git-dir`);
      let depth = 1;
      while ((await exec(`git checkout -q ${ref}`)) > 0) {
        //  When repo gets to the max depth of the origin Git silenty turns it into a deep clone
        if (!existsSync(join("scratch"))) {
          debug("reached maximum depth");
          return 0;
        }
        depth += 2;
        if (maxDepth && depth > maxDepth) {
          throw new Error(
            `exceeded max checkout depth of ${maxDepth} finding commit ${ref} in ${context.repo}@${branch}`
          );
        }
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
        `failed to checkout ${repo.owner}/${repo.repo}@${branch}`
      );
    }
  } catch (error) {
    setFailed(error.message);
  }
};

run();

export default run;
