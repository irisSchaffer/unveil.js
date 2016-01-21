jest.dontMock('../Utils');

require('../Utils');

describe("Utils", () => {

  describe("Array.prototype.equals", () => {

    it("fails on different length arrays", () => {
      const a = [1,2],
            b = [1,2,3];

      expect(a.equals(b)).toEqual(false);
    });

    it("succeeds when arrays have equal length and elements", () => {
      const a = [1,2,3],
            b = [1,2,3];

      expect(a.equals(b)).toEqual(true);
    });

    it("fails when arrays have equal length but different elements", () => {
      const a = [1,2,3],
            b = [1,2,5];

      expect(a.equals(b)).toEqual(false);
    });

    it("fails when arrays have equal length but differently positioned elements", () => {
      const a = [1,2,3],
            b = [1,3,2];

      expect(a.equals(b)).toEqual(false);
    });

  });

});
