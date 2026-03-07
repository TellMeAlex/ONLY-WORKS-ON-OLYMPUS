import { test, expect, describe, beforeEach } from "bun:test";
import {
  deprecationWarn,
  formatDeprecationMessage,
  isDeprecated,
  clearEmittedWarnings,
  getEmittedWarnings,
  hasEmittedWarning,
  createDeprecationError,
  type DeprecationOptions,
} from "./deprecation.js";

describe("formatDeprecationMessage", () => {
  test("formats basic deprecation message", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
    };

    // Act
    const message = formatDeprecationMessage(options);

    // Assert
    expect(message).toContain("[DEPRECATION WARNING]");
    expect(message).toContain("OldFunction");
    expect(message).toContain("deprecated since v0.4.0");
  });

  test("formats deprecation message with replacement", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
      replacement: "newFunction",
    };

    // Act
    const message = formatDeprecationMessage(options);

    // Assert
    expect(message).toContain("Replacement: newFunction");
  });

  test("formats deprecation message with removal version", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
      removal: "1.0.0",
    };

    // Act
    const message = formatDeprecationMessage(options);

    // Assert
    expect(message).toContain("Will be removed in: v1.0.0");
  });

  test("formats deprecation message with docs URL", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
      docsUrl: "./docs/migration-v0.4.0.md",
    };

    // Act
    const message = formatDeprecationMessage(options);

    // Assert
    expect(message).toContain("Documentation: ./docs/migration-v0.4.0.md");
  });

  test("formats deprecation message with custom message", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
      message: "This function is being replaced by a more efficient approach.",
    };

    // Act
    const message = formatDeprecationMessage(options);

    // Assert
    expect(message).toContain("This function is being replaced by a more efficient approach.");
  });

  test("formats complete deprecation message", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
      replacement: "newFunction",
      removal: "1.0.0",
      docsUrl: "./docs/migration-v0.4.0.md",
      message: "Please migrate to the new API.",
    };

    // Act
    const message = formatDeprecationMessage(options);

    // Assert
    expect(message).toContain("[DEPRECATION WARNING]");
    expect(message).toContain("OldFunction");
    expect(message).toContain("deprecated since v0.4.0");
    expect(message).toContain("Please migrate to the new API.");
    expect(message).toContain("Replacement: newFunction");
    expect(message).toContain("Will be removed in: v1.0.0");
    expect(message).toContain("Documentation: ./docs/migration-v0.4.0.md");
  });
});

describe("deprecationWarn", () => {
  beforeEach(() => {
    clearEmittedWarnings();
  });

  test("emits warning to console", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
    };
    const originalWarn = console.warn;
    let warningLogged = false;
    console.warn = (...args) => {
      warningLogged = true;
      originalWarn(...args);
    };

    try {
      // Act
      deprecationWarn(options);

      // Assert
      expect(warningLogged).toBe(true);
      expect(hasEmittedWarning("OldFunction", "0.4.0")).toBe(true);
    } finally {
      console.warn = originalWarn;
    }
  });

  test("only emits warning once per API version", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
    };
    const originalWarn = console.warn;
    let warningCount = 0;
    console.warn = (...args) => {
      warningCount++;
      originalWarn(...args);
    };

    try {
      // Act
      deprecationWarn(options);
      deprecationWarn(options);
      deprecationWarn(options);

      // Assert
      expect(warningCount).toBe(1);
    } finally {
      console.warn = originalWarn;
    }
  });

  test("emits warnings for different API versions separately", () => {
    // Arrange
    const options1: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
    };
    const options2: DeprecationOptions = {
      api: "OldFunction",
      version: "0.5.0",
    };
    const originalWarn = console.warn;
    let warningCount = 0;
    console.warn = (...args) => {
      warningCount++;
      originalWarn(...args);
    };

    try {
      // Act
      deprecationWarn(options1);
      deprecationWarn(options2);
      deprecationWarn(options1);
      deprecationWarn(options2);

      // Assert
      expect(warningCount).toBe(2);
    } finally {
      console.warn = originalWarn;
    }
  });

  test("emits warnings for different APIs separately", () => {
    // Arrange
    const options1: DeprecationOptions = {
      api: "OldFunction1",
      version: "0.4.0",
    };
    const options2: DeprecationOptions = {
      api: "OldFunction2",
      version: "0.4.0",
    };
    const originalWarn = console.warn;
    let warningCount = 0;
    console.warn = (...args) => {
      warningCount++;
      originalWarn(...args);
    };

    try {
      // Act
      deprecationWarn(options1);
      deprecationWarn(options2);
      deprecationWarn(options1);
      deprecationWarn(options2);

      // Assert
      expect(warningCount).toBe(2);
    } finally {
      console.warn = originalWarn;
    }
  });
});

describe("isDeprecated", () => {
  beforeEach(() => {
    clearEmittedWarnings();
  });

  test("returns true and emits warning when current version is after deprecation version", () => {
    // Arrange
    const originalWarn = console.warn;
    let warningLogged = false;
    console.warn = (...args) => {
      warningLogged = true;
      originalWarn(...args);
    };

    try {
      // Act
      const result = isDeprecated("OldFunction", "0.4.0", "0.5.0");

      // Assert
      expect(result).toBe(true);
      expect(warningLogged).toBe(true);
    } finally {
      console.warn = originalWarn;
    }
  });

  test("returns false when current version is before deprecation version", () => {
    // Arrange
    const originalWarn = console.warn;
    let warningLogged = false;
    console.warn = (...args) => {
      warningLogged = true;
      originalWarn(...args);
    };

    try {
      // Act
      const result = isDeprecated("OldFunction", "0.5.0", "0.4.0");

      // Assert
      expect(result).toBe(false);
      expect(warningLogged).toBe(false);
    } finally {
      console.warn = originalWarn;
    }
  });

  test("returns false when current version equals deprecation version", () => {
    // Arrange
    const originalWarn = console.warn;
    let warningLogged = false;
    console.warn = (...args) => {
      warningLogged = true;
      originalWarn(...args);
    };

    try {
      // Act
      const result = isDeprecated("OldFunction", "0.5.0", "0.5.0");

      // Assert
      expect(result).toBe(false);
      expect(warningLogged).toBe(false);
    } finally {
      console.warn = originalWarn;
    }
  });

  test("returns true and emits warning when current version is undefined", () => {
    // Arrange
    const originalWarn = console.warn;
    let warningLogged = false;
    console.warn = (...args) => {
      warningLogged = true;
      originalWarn(...args);
    };

    try {
      // Act
      const result = isDeprecated("OldFunction", "0.4.0", undefined);

      // Assert
      expect(result).toBe(true);
      expect(warningLogged).toBe(true);
    } finally {
      console.warn = originalWarn;
    }
  });

  test("passes additional options to deprecation warning", () => {
    // Arrange
    const originalWarn = console.warn;
    let warningMessage = "";
    console.warn = (...args) => {
      warningMessage = args.join(" ");
      originalWarn(...args);
    };

    try {
      // Act
      isDeprecated("OldFunction", "0.4.0", "0.5.0", {
        replacement: "newFunction",
        removal: "1.0.0",
      });

      // Assert
      expect(warningMessage).toContain("newFunction");
      expect(warningMessage).toContain("1.0.0");
    } finally {
      console.warn = originalWarn;
    }
  });

  test("compares versions correctly for 0.x series", () => {
    // Arrange
    const testCases = [
      { deprecated: "0.4.0", current: "0.4.1", expected: true },
      { deprecated: "0.4.0", current: "0.5.0", expected: true },
      { deprecated: "0.4.5", current: "0.5.0", expected: true },
      { deprecated: "0.5.0", current: "0.4.0", expected: false },
      { deprecated: "0.5.0", current: "0.4.9", expected: false },
      { deprecated: "0.4.0", current: "0.4.0", expected: false },
      { deprecated: "0.4.10", current: "0.4.2", expected: false },
    ];

    for (const testCase of testCases) {
      // Arrange
      const originalWarn = console.warn;
      let warningLogged = false;
      console.warn = (...args) => {
        warningLogged = true;
        originalWarn(...args);
      };

      try {
        // Act
        const result = isDeprecated("TestAPI", testCase.deprecated, testCase.current);

        // Assert
        expect(result).toBe(testCase.expected);
        expect(warningLogged).toBe(testCase.expected);
      } finally {
        console.warn = originalWarn;
        clearEmittedWarnings();
      }
    }
  });
});

describe("clearEmittedWarnings", () => {
  test("clears all emitted warnings", () => {
    // Arrange
    deprecationWarn({ api: "OldFunction", version: "0.4.0" });
    deprecationWarn({ api: "AnotherAPI", version: "0.5.0" });

    // Act
    clearEmittedWarnings();

    // Assert
    expect(getEmittedWarnings().size).toBe(0);
  });

  test("allows re-emitting warnings after clear", () => {
    // Arrange
    deprecationWarn({ api: "OldFunction", version: "0.4.0" });
    const originalWarn = console.warn;
    let warningCount = 0;
    console.warn = (...args) => {
      warningCount++;
      originalWarn(...args);
    };

    try {
      // Act
      clearEmittedWarnings();
      deprecationWarn({ api: "OldFunction", version: "0.4.0" });
      deprecationWarn({ api: "OldFunction", version: "0.4.0" });

      // Assert
      expect(warningCount).toBe(1);
    } finally {
      console.warn = originalWarn;
    }
  });
});

describe("getEmittedWarnings", () => {
  beforeEach(() => {
    clearEmittedWarnings();
  });

  test("returns empty set when no warnings emitted", () => {
    // Act
    const emitted = getEmittedWarnings();

    // Assert
    expect(emitted.size).toBe(0);
  });

  test("returns set with emitted warnings", () => {
    // Arrange
    deprecationWarn({ api: "OldFunction", version: "0.4.0" });
    deprecationWarn({ api: "AnotherAPI", version: "0.5.0" });

    // Act
    const emitted = getEmittedWarnings();

    // Assert
    expect(emitted.size).toBe(2);
    expect(emitted.has("OldFunction:0.4.0")).toBe(true);
    expect(emitted.has("AnotherAPI:0.5.0")).toBe(true);
  });

  test("returns a copy (modifying returned set does not affect internal state)", () => {
    // Arrange
    deprecationWarn({ api: "OldFunction", version: "0.4.0" });
    const emitted = getEmittedWarnings();

    // Act
    emitted.clear();

    // Assert
    expect(getEmittedWarnings().size).toBe(1);
  });
});

describe("hasEmittedWarning", () => {
  beforeEach(() => {
    clearEmittedWarnings();
  });

  test("returns false for non-emitted warning", () => {
    // Act
    const result = hasEmittedWarning("OldFunction", "0.4.0");

    // Assert
    expect(result).toBe(false);
  });

  test("returns true for emitted warning", () => {
    // Arrange
    deprecationWarn({ api: "OldFunction", version: "0.4.0" });

    // Act
    const result = hasEmittedWarning("OldFunction", "0.4.0");

    // Assert
    expect(result).toBe(true);
  });

  test("returns false for different API", () => {
    // Arrange
    deprecationWarn({ api: "OldFunction", version: "0.4.0" });

    // Act
    const result = hasEmittedWarning("AnotherFunction", "0.4.0");

    // Assert
    expect(result).toBe(false);
  });

  test("returns false for different version", () => {
    // Arrange
    deprecationWarn({ api: "OldFunction", version: "0.4.0" });

    // Act
    const result = hasEmittedWarning("OldFunction", "0.5.0");

    // Assert
    expect(result).toBe(false);
  });
});

describe("createDeprecationError", () => {
  test("creates error with formatted message", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
      replacement: "newFunction",
      removal: "1.0.0",
    };

    // Act
    const error = createDeprecationError(options);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("[DEPRECATION WARNING]");
    expect(error.message).toContain("OldFunction");
    expect(error.message).toContain("newFunction");
    expect(error.message).toContain("1.0.0");
  });

  test("creates error with all options", () => {
    // Arrange
    const options: DeprecationOptions = {
      api: "OldFunction",
      version: "0.4.0",
      replacement: "newFunction",
      removal: "1.0.0",
      docsUrl: "./docs/migration-v0.4.0.md",
      message: "This function is removed.",
    };

    // Act
    const error = createDeprecationError(options);

    // Assert
    expect(error.message).toContain("OldFunction");
    expect(error.message).toContain("newFunction");
    expect(error.message).toContain("1.0.0");
    expect(error.message).toContain("./docs/migration-v0.4.0.md");
    expect(error.message).toContain("This function is removed.");
  });
});
