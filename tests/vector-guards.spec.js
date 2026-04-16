const {
  extractLineDirections,
  verifyLineLineRelationClaim,
  verifyLinePlaneRelationClaim,
  verifyParallelLinesClaim,
  verifyOrthogonalityClaim,
  verifyPointOnLineClaim,
  verifyPointOnPlaneClaim,
} = require("../vector-guards.js");

describe("vector guards", () => {
  it("extracts direction vectors from line equations", () => {
    const directions = extractLineDirections(
      "Gegeben sind die Geraden g: x=(1|2|3)+r(2|1|0) und h: x=(0|1|0)+s(4|2|0)."
    );

    expect(directions.g).toEqual([2, 1, 0]);
    expect(directions.h).toEqual([4, 2, 0]);
  });

  it("accepts a correct parallel claim for two lines", () => {
    const result = verifyParallelLinesClaim({
      task: {
        question: "Gegeben sind die Geraden g: x=(1|2|3)+r(2|1|0) und h: x=(0|1|0)+s(4|2|0).",
      },
      draft: "Die Geraden g und h sind parallel.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a wrong parallel claim for two lines", () => {
    const result = verifyParallelLinesClaim({
      task: {
        question: "Gegeben sind die Geraden g: x=(1|2|3)+r(2|1|0) und h: x=(0|1|0)+s(1|0|1).",
      },
      draft: "Die Geraden g und h sind parallel.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("vector-parallel-check-failed");
  });

  it("accepts a correct orthogonality claim", () => {
    const result = verifyOrthogonalityClaim({
      task: {
        question: "Gegeben sind die Vektoren a=(1|2|0) und b=(2|-1|0). Begründen Sie, dass sie orthogonal sind.",
      },
      draft: "Die Vektoren a und b sind orthogonal.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a wrong orthogonality claim", () => {
    const result = verifyOrthogonalityClaim({
      task: {
        question: "Gegeben sind die Vektoren a=(1|2|0) und b=(1|1|0).",
      },
      draft: "Die Vektoren a und b sind orthogonal.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("vector-orthogonality-check-failed");
  });

  it("accepts a correct point-on-line claim", () => {
    const result = verifyPointOnLineClaim({
      task: {
        question: "Gegeben ist die Gerade g: x=(1|2|3)+r(2|1|0).",
      },
      draft: "Der Punkt P(3|3|3) liegt auf g.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a wrong point-on-line claim", () => {
    const result = verifyPointOnLineClaim({
      task: {
        question: "Gegeben ist die Gerade g: x=(1|2|3)+r(2|1|0).",
      },
      draft: "Der Punkt P(2|3|3) liegt auf g.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("point-line-check-failed");
  });

  it("accepts a correct point-on-plane claim", () => {
    const result = verifyPointOnPlaneClaim({
      task: {
        question: "Gegeben ist die Ebene E: 2x-y+z=4.",
      },
      draft: "Der Punkt A(1|0|2) liegt auf E.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a wrong point-on-plane claim", () => {
    const result = verifyPointOnPlaneClaim({
      task: {
        question: "Gegeben ist die Ebene E: 2x-y+z=4.",
      },
      draft: "Der Punkt A(1|1|2) liegt auf E.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("point-plane-check-failed");
  });

  it("accepts a correct intersecting line-line claim", () => {
    const result = verifyLineLineRelationClaim({
      task: {
        question: "Gegeben sind die Geraden g: x=(0|0|0)+r(1|0|0) und h: x=(0|0|0)+s(0|1|0). Untersuchen Sie die Lagebeziehung.",
      },
      draft: "Die Geraden g und h schneiden sich.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a wrong line-line relation claim", () => {
    const result = verifyLineLineRelationClaim({
      task: {
        question: "Gegeben sind die Geraden g: x=(0|0|1)+r(1|0|0) und h: x=(0|1|0)+s(0|1|0). Untersuchen Sie die Lagebeziehung.",
      },
      draft: "Die Geraden g und h schneiden sich.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("vector-line-line-check-failed");
  });

  it("accepts a correct intersecting line-plane claim", () => {
    const result = verifyLinePlaneRelationClaim({
      task: {
        question: "Gegeben sind die Gerade g: x=(0|0|1)+r(0|0|-1) und die Ebene E: z=0. Untersuchen Sie die Lagebeziehung.",
      },
      draft: "Die Gerade g schneidet die Ebene E.",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a wrong line-plane relation claim", () => {
    const result = verifyLinePlaneRelationClaim({
      task: {
        question: "Gegeben sind die Gerade g: x=(0|0|1)+r(1|0|0) und die Ebene E: z=0. Untersuchen Sie die Lagebeziehung.",
      },
      draft: "Die Gerade g schneidet die Ebene E.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe("vector-line-plane-check-failed");
  });
});
