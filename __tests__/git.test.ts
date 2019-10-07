import * as assert from "assert";
import { DefaultGit } from "../src/git";

describe("git", () => {
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
