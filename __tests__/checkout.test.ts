import * as assert from "assert";
import { GitCheckout } from "../src/checkout";

describe("checkout", () => {
  describe("GitCheckout", () => {
    describe("gitDir", () => {
      it("is typically just .git", async () => {
        assert.equal(await new GitCheckout("s3cr3t").gitDir(), ".git");
      });
    });
    describe("cloneString", () => {
      it("generates expected string", () => {
        assert.equal(
          new GitCheckout("s3cr3t").cloneString(
            "master",
            1,
            "meetup/express-checkout"
          ),
          `git clone --single-branch --branch master --depth 1 https://s3cr3t:x-oauth-basic@github.com/meetup/express-checkout.git .`
        );
      });
    });
  });
});
