import assert from "node:assert/strict";

export function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected);
    },
    toBeNull() {
      assert.equal(actual, null);
    },
    toBeGreaterThanOrEqual(expected: number) {
      assert.ok(typeof actual === "number" && actual >= expected, `${String(actual)} >= ${expected}`);
    },
    toContain(expected: string) {
      if (typeof actual === "string") {
        assert.ok(actual.includes(expected), actual);
        return;
      }
      if (Array.isArray(actual)) {
        assert.ok(actual.includes(expected), JSON.stringify(actual));
        return;
      }
      assert.fail("toContain precisa de texto ou lista");
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.equal(typeof actual, "string");
        assert.equal(pattern.test(String(actual)), false);
      },
      toContain(expected: string) {
        assert.equal(typeof actual, "string");
        assert.equal(String(actual).toLowerCase().includes(expected.toLowerCase()), false);
      },
    },
  };
}
