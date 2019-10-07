import * as assert from "assert";
import { GitCheckout, DefaultGit } from "../src/checkout";

// beforeEach(() => {
//   jest.resetModules()
// })

// afterEach(() => {
// })

describe("checkout", () => {
  describe("GitCheckout", () => {
    describe("clone", () => {
      it("returns failed status when failing to clone", async () => {
        const checkout = new GitCheckout("s3cr3t", {
          dir: (): Promise<string> => Promise.resolve(".git"),

          cloneString: (
            cloneToken: string,
            branch: string,
            depth: number,
            repoUri: string,
            desitination: string
          ): string => "...",

          clone: (
            cloneToken: string,
            branch: string,
            depth: number,
            repoUri: string,
            desitination: string
          ): Promise<number> => Promise.resolve(1),

          checkoutRef: (ref: string): Promise<number> => Promise.resolve(2),

          reachedFullDepth: (gitDir: string): boolean => true,

          fetch: (depth: number): Promise<number> => Promise.resolve(0)
        });
        const status = await checkout.checkout(
          { owner: "foo", repo: "bar" },
          "master",
          "123",
          10,
          "."
        );
        assert.equal(status, 1);
      });

      it("may successfully clone but fail to find commit after a maximum depth", async () => {
        const checkout = new GitCheckout("s3cr3t", {
          dir: (): Promise<string> => Promise.resolve(".git"),
          cloneString: (
            cloneToken: string,
            branch: string,
            depth: number,
            repoUri: string,
            desitination: string
          ): string => "...",

          clone: (
            cloneToken: string,
            branch: string,
            depth: number,
            repoUri: string,
            desitination: string
          ): Promise<number> => Promise.resolve(0),

          checkoutRef: (ref: string): Promise<number> => Promise.resolve(2),

          reachedFullDepth: (gitDir: string): boolean => false,

          fetch: (depth: number): Promise<number> => Promise.resolve(0)
        });
        expect.assertions(1);
        await expect(
          checkout.checkout(
            { owner: "foo", repo: "bar" },
            "master",
            "123",
            1,
            "."
          )
        ).rejects.toEqual(
          new Error(
            "Exceeded max checkout depth of 1 finding commit 123 in foo/bar@master"
          )
        );
      });

      it("may successfully clone but fail to find commit completely", async () => {
        const checkout = new GitCheckout("s3cr3t", {
          dir: (): Promise<string> => Promise.resolve(".git"),
          cloneString: (
            cloneToken: string,
            branch: string,
            depth: number,
            repoUri: string,
            desitination: string
          ): string => "...",

          clone: (
            cloneToken: string,
            branch: string,
            depth: number,
            repoUri: string,
            desitination: string
          ): Promise<number> => Promise.resolve(0),

          checkoutRef: (ref: string): Promise<number> => Promise.resolve(2),

          reachedFullDepth: (gitDir: string): boolean => true,

          fetch: (depth: number): Promise<number> => Promise.resolve(0)
        });
        expect.assertions(1);
        await expect(
          checkout.checkout(
            { owner: "foo", repo: "bar" },
            "master",
            "123",
            1,
            "."
          )
        ).rejects.toEqual(new Error("Reached checkout maximum depth"));
      });
    });
  });

  describe("DefaultGit", () => {
    describe("dir", () => {
      it("is typically just .git", async () => {
        assert.equal(await new DefaultGit().dir(), ".git");
      });
    });
    describe("cloneString", () => {
      it("generates expected string", () => {
        assert.equal(
          new DefaultGit().cloneString(
            "s3cr3t",
            "master",
            1,
            "meetup/express-checkout",
            "."
          ),
          `git clone --single-branch --branch master --depth 1 https://s3cr3t:x-oauth-basic@github.com/meetup/express-checkout.git .`
        );
      });
    });
  });
});
