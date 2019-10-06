import { setFailed } from "@actions/core";
import { context } from "@actions/github";
import { env } from "process";
import { Checkout, GitCheckout } from "./checkout";

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

const run = async (): Promise<void> => {
  try {
    const { checkout, repo, branch, ref, maxDepth } = extract(env, context);
    const status = await checkout.checkout(repo, branch, ref, maxDepth, ".");
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
