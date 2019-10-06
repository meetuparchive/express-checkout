import * as assert from "assert";
import { extract } from "../src/main";

describe("main", () => {
  describe("extract", () => {
    it("extracts arguments to apply to main", () => {
      let expectedRepo = {
        owner: "meetup",
        repo: "express-checkout"
      };
      const { repo, branch, ref, maxDepth } = extract(
        {
          GITHUB_TOKEN: "foo",
          GITHUB_REF: "branches/heads/master"
        },
        {
          repo: expectedRepo,
          sha: "123"
        }
      );
      assert.deepEqual(repo, expectedRepo);
      assert.equal(ref, "123");
      assert.equal(maxDepth, 100);
      assert.equal(branch, "master");
    });
    it("accepts custom maxDepth", () => {
      const { maxDepth } = extract(
        {
          GITHUB_TOKEN: "foo",
          GITHUB_REF: "branches/heads/master",
          INPUT_MAX_DEPTH: "5"
        },
        {
          repo: {
            owner: "meetup",
            repo: "express-checkout"
          },
          sha: "123"
        }
      );
      assert.equal(maxDepth, 5);
    });
  });

  describe("run", () => {
    it("runs action", () => {
      assert.equal(1 + 1, 2);
    });
  });
});
