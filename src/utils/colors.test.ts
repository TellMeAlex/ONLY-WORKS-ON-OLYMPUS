import { test, expect, describe } from "bun:test";
import {
  success,
  warning,
  error,
  info,
  bold,
  dim,
  reset,
} from "./colors.js";

describe("colors", () => {
  describe("success", () => {
    test("wraps text with ANSI green codes", () => {
      // Arrange
      const text = "Operation completed successfully";
      const expected = "\x1b[32mOperation completed successfully\x1b[0m";

      // Act
      const result = success(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles empty string", () => {
      // Arrange
      const text = "";
      const expected = "\x1b[32m\x1b[0m";

      // Act
      const result = success(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles special characters", () => {
      // Arrange
      const text = "Hello & Goodbye!";
      const expected = "\x1b[32mHello & Goodbye!\x1b[0m";

      // Act
      const result = success(text);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("warning", () => {
    test("wraps text with ANSI yellow codes", () => {
      // Arrange
      const text = "This is a warning";
      const expected = "\x1b[33mThis is a warning\x1b[0m";

      // Act
      const result = warning(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles empty string", () => {
      // Arrange
      const text = "";
      const expected = "\x1b[33m\x1b[0m";

      // Act
      const result = warning(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles special characters", () => {
      // Arrange
      const text = "Warning: <file.txt> not found";
      const expected = "\x1b[33mWarning: <file.txt> not found\x1b[0m";

      // Act
      const result = warning(text);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("error", () => {
    test("wraps text with ANSI red codes", () => {
      // Arrange
      const text = "An error occurred";
      const expected = "\x1b[31mAn error occurred\x1b[0m";

      // Act
      const result = error(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles empty string", () => {
      // Arrange
      const text = "";
      const expected = "\x1b[31m\x1b[0m";

      // Act
      const result = error(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles special characters", () => {
      // Arrange
      const text = "Error: `command` failed";
      const expected = "\x1b[31mError: `command` failed\x1b[0m";

      // Act
      const result = error(text);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("info", () => {
    test("wraps text with ANSI cyan codes", () => {
      // Arrange
      const text = "This is informational";
      const expected = "\x1b[36mThis is informational\x1b[0m";

      // Act
      const result = info(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles empty string", () => {
      // Arrange
      const text = "";
      const expected = "\x1b[36m\x1b[0m";

      // Act
      const result = info(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles special characters", () => {
      // Arrange
      const text = "Info: [status] pending";
      const expected = "\x1b[36mInfo: [status] pending\x1b[0m";

      // Act
      const result = info(text);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("bold", () => {
    test("wraps text with ANSI bold codes", () => {
      // Arrange
      const text = "Important message";
      const expected = "\x1b[1mImportant message\x1b[0m";

      // Act
      const result = bold(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles empty string", () => {
      // Arrange
      const text = "";
      const expected = "\x1b[1m\x1b[0m";

      // Act
      const result = bold(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles special characters", () => {
      // Arrange
      const text = "**Bold** text";
      const expected = "\x1b[1m**Bold** text\x1b[0m";

      // Act
      const result = bold(text);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("dim", () => {
    test("wraps text with ANSI dim codes", () => {
      // Arrange
      const text = "Secondary information";
      const expected = "\x1b[2mSecondary information\x1b[0m";

      // Act
      const result = dim(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles empty string", () => {
      // Arrange
      const text = "";
      const expected = "\x1b[2m\x1b[0m";

      // Act
      const result = dim(text);

      // Assert
      expect(result).toBe(expected);
    });

    test("handles special characters", () => {
      // Arrange
      const text = "(dim text)";
      const expected = "\x1b[2m(dim text)\x1b[0m";

      // Act
      const result = dim(text);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("reset", () => {
    test("returns ANSI reset code", () => {
      // Arrange
      const expected = "\x1b[0m";

      // Act
      const result = reset();

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("integration", () => {
    test("multiple color functions can be chained", () => {
      // Arrange
      const text = "Test";
      const expected =
        "\x1b[32m\x1b[1m\x1b[36mTest\x1b[0m\x1b[0m\x1b[0m";

      // Act
      const result = success(bold(info(text)));

      // Assert
      expect(result).toBe(expected);
    });

    test("color and style functions can be combined", () => {
      // Arrange
      const text = "Error occurred";
      const expected = "\x1b[32m\x1b[1mError occurred\x1b[0m\x1b[0m";

      // Act
      const result = success(bold(text));

      // Assert
      expect(result).toBe(expected);
    });
  });
});
