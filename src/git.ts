import { exec } from "@actions/exec";
import { existsSync } from "fs";
import { join } from "path";
import execa from "execa";

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
