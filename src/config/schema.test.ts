import { test, expect, describe } from "bun:test";
import {
  RegexMatcherSchema,
  KeywordMatcherSchema,
  ComplexityMatcherSchema,
  ProjectContextMatcherSchema,
  AlwaysMatcherSchema,
  MatcherSchema,
  RoutingRuleSchema,
  MetaAgentSchema,
  OlimpusConfigSchema,
} from "./schema.js";

describe("RegexMatcherSchema", () => {
  describe("flags field validation", () => {
    describe("valid flags", () => {
      test("accepts valid single flag 'g'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "g",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts valid single flag 'i'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "i",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts valid single flag 'm'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "m",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts valid single flag 's'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "s",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts valid single flag 'u'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "u",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts valid single flag 'y'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "y",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts valid single flag 'd'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "d",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts multiple valid flags in any order", () => {
        // Arrange
        const matchers = [
          { type: "regex" as const, pattern: "test", flags: "gi" },
          { type: "regex" as const, pattern: "test", flags: "gm" },
          { type: "regex" as const, pattern: "test", flags: "im" },
          { type: "regex" as const, pattern: "test", flags: "gs" },
          { type: "regex" as const, pattern: "test", flags: "igms" },
          { type: "regex" as const, pattern: "test", flags: "gimsuy" },
        ];

        // Act & Assert
        matchers.forEach((matcher) => {
          const result = RegexMatcherSchema.parse(matcher);
          expect(result).toEqual(matcher);
        });
      });

      test("accepts all valid flags together", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "gimsuyd",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts empty flags (optional field)", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
        expect(result.flags).toBeUndefined();
      });
    });

    describe("invalid flags - characters not allowed", () => {
      test("rejects invalid single flag 'a'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "a",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects invalid single flag 'x'", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "x",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects flags containing invalid characters", () => {
        // Arrange
        const matchers = [
          { type: "regex" as const, pattern: "test", flags: "gx" },
          { type: "regex" as const, pattern: "test", flags: "ai" },
          { type: "regex" as const, pattern: "test", flags: "igmz" },
          { type: "regex" as const, pattern: "test", flags: "abc" },
        ];

        // Act & Assert
        matchers.forEach((matcher) => {
          expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
        });
      });

      test("rejects whitespace in flags", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "g i",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects special characters in flags", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "g!",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects numeric characters in flags", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "g1",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });
    });

    describe("duplicate flags", () => {
      test("rejects duplicate 'g' flag", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "gg",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects duplicate 'i' flag", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "ii",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects multiple duplicate flags", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "ggiimm",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects flags with duplicate in middle", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "gimmsuy",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects flags with duplicate at end", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "gimsuyy",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("rejects flags with duplicate at beginning", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test",
          flags: "ggimsuy",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });
    });

    describe("pattern field validation", () => {
      test("requires pattern to be present", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "",
        };

        // Act & Assert
        expect(() => RegexMatcherSchema.parse(matcher)).toThrow();
      });

      test("accepts valid regex pattern", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "test.*",
          flags: "gi",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });

      test("accepts complex regex pattern", () => {
        // Arrange
        const matcher = {
          type: "regex" as const,
          pattern: "^\\w+@\\w+\\.\\w+$",
          flags: "i",
        };

        // Act
        const result = RegexMatcherSchema.parse(matcher);

        // Assert
        expect(result).toEqual(matcher);
      });
    });
  });
});

describe("KeywordMatcherSchema", () => {
  test("accepts valid keyword matcher", () => {
    // Arrange
    const matcher = {
      type: "keyword" as const,
      keywords: ["test", "example"],
      mode: "any" as const,
    };

    // Act
    const result = KeywordMatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });

  test("requires at least one keyword", () => {
    // Arrange
    const matcher = {
      type: "keyword" as const,
      keywords: [],
      mode: "any" as const,
    };

    // Act & Assert
    expect(() => KeywordMatcherSchema.parse(matcher)).toThrow();
  });
});

describe("ComplexityMatcherSchema", () => {
  test("accepts valid complexity matcher", () => {
    // Arrange
    const matcher = {
      type: "complexity" as const,
      threshold: "medium" as const,
    };

    // Act
    const result = ComplexityMatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });
});

describe("ProjectContextMatcherSchema", () => {
  test("accepts valid project context matcher", () => {
    // Arrange
    const matcher = {
      type: "project_context" as const,
      has_files: ["ts", "js"],
      has_deps: ["react"],
    };

    // Act
    const result = ProjectContextMatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });

  test("accepts project context matcher without optional fields", () => {
    // Arrange
    const matcher = {
      type: "project_context" as const,
    };

    // Act
    const result = ProjectContextMatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });
});

describe("AlwaysMatcherSchema", () => {
  test("accepts always matcher", () => {
    // Arrange
    const matcher = {
      type: "always" as const,
    };

    // Act
    const result = AlwaysMatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });
});

describe("MatcherSchema discriminated union", () => {
  test("accepts keyword matcher", () => {
    // Arrange
    const matcher = {
      type: "keyword" as const,
      keywords: ["test"],
      mode: "all" as const,
    };

    // Act
    const result = MatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });

  test("accepts regex matcher", () => {
    // Arrange
    const matcher = {
      type: "regex" as const,
      pattern: "test",
      flags: "gi",
    };

    // Act
    const result = MatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });

  test("accepts complexity matcher", () => {
    // Arrange
    const matcher = {
      type: "complexity" as const,
      threshold: "high" as const,
    };

    // Act
    const result = MatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });

  test("accepts project_context matcher", () => {
    // Arrange
    const matcher = {
      type: "project_context" as const,
    };

    // Act
    const result = MatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });

  test("accepts always matcher", () => {
    // Arrange
    const matcher = {
      type: "always" as const,
    };

    // Act
    const result = MatcherSchema.parse(matcher);

    // Assert
    expect(result).toEqual(matcher);
  });

  test("rejects matcher with invalid type", () => {
    // Arrange
    const matcher = {
      type: "invalid" as const,
    };

    // Act & Assert
    expect(() => MatcherSchema.parse(matcher)).toThrow();
  });
});
