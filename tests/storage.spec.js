const { createStorage } = require("../storage.js");

describe("createStorage", () => {
  beforeEach(() => {
    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] ?? null;
      },
      setItem(key, value) {
        this.data[key] = String(value);
      },
      removeItem(key) {
        delete this.data[key];
      },
    };
  });

  it("stores and restores versioned JSON payloads", () => {
    const storage = createStorage("martha4");
    storage.write("prefs", { toolMode: "cas", examPart: "part2" });

    expect(storage.read("prefs")).toEqual({
      toolMode: "cas",
      examPart: "part2",
    });
  });
});
