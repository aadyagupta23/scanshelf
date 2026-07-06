import { describe, it, expect } from "@jest/globals";
import groqClient from "../../server/groq-client";

// Unified LLM provider tests
describe("Unified LLM Provider", () => {
  // Local Heuristics
  it("should fall back to local OCR title extraction heuristic", async () => {
    const ocrText = "Extracted text:\nBook One by Author One, Book Two by Author Two";
    const response = await groqClient.chat.completions.create({
      messages: [
        { role: "system", content: "You are a precise book identification expert specializing in reading book spines on bookshelves." },
        { role: "user", content: ocrText }
      ],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    expect(content.bookTitles).toBeDefined();
    expect(Array.isArray(content.bookTitles)).toBe(true);
    expect(content.isBookshelf).toBe(true);
  });

  // Local recommendations
  it("should generate offline recommendations based on preferences", async () => {
    const books = [
      { title: "Design Patterns", author: "Gang of Four" },
      { title: "Clean Code", author: "Robert Martin" }
    ];
    const response = await groqClient.chat.completions.create({
      messages: [
        { role: "system", content: "You are a literary recommendation expert." },
        { role: "user", content: `Here is my list of books:\n${JSON.stringify(books)}\nMy reading preferences:\nGenres I enjoy: programming, software.\nFrom ONLY this list, recommend books.` }
      ],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    expect(content.recommendations).toBeDefined();
    expect(content.recommendations.length).toBeGreaterThan(0);
    expect(content.recommendations[0].title).toBe("Design Patterns");
  });
});
