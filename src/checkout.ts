import { debug } from "@actions/core";
import { Git } from "./git";

export interface Checkout {
  checkout(
    repo: { owner: string; repo: string },
    branch: string,
    ref: string,
    maxDepth: number | undefined,
    destination: string
  ): Promise<number>;
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
