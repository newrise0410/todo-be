import { test } from "node:test";
import assert from "node:assert/strict";
import { parseContent } from "../src/llm.js";

test("parses a clean JSON object with todos", () => {
  const content = JSON.stringify({
    todos: [{ title: "면접", priority: "high", dueDate: "2026-07-09" }],
  });
  assert.deepEqual(parseContent(content), [
    { title: "면접", priority: "high", dueDate: "2026-07-09" },
  ]);
});

test("strips markdown code fences", () => {
  const content =
    '```json\n{"todos":[{"title":"장보기","priority":"low","dueDate":null}]}\n```';
  assert.deepEqual(parseContent(content), [
    { title: "장보기", priority: "low", dueDate: null },
  ]);
});

test("defaults an invalid priority to medium", () => {
  const content = '{"todos":[{"title":"운동","priority":"urgent"}]}';
  assert.equal(parseContent(content)[0].priority, "medium");
});

test("nulls an invalid dueDate", () => {
  const content = '{"todos":[{"title":"보고서","dueDate":"금요일"}]}';
  assert.equal(parseContent(content)[0].dueDate, null);
});

test("trims titles and skips empty ones", () => {
  const content =
    '{"todos":[{"title":"  청소  "},{"title":"   "},{"title":""}]}';
  const result = parseContent(content);
  assert.equal(result.length, 1);
  assert.equal(result[0].title, "청소");
});

test("accepts a bare array", () => {
  const content = '[{"title":"메일 확인"}]';
  assert.deepEqual(parseContent(content), [
    { title: "메일 확인", priority: "medium", dueDate: null },
  ]);
});

test("throws on non-JSON content", () => {
  assert.throws(() => parseContent("죄송하지만 이해하지 못했습니다"));
});
