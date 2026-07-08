const PRIORITIES = ["low", "medium", "high"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const BASE_URL = process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1";
const MODEL = process.env.MINIMAX_MODEL || "MiniMax-M3";

/** LLM 응답 텍스트에서 코드펜스를 제거한다. */
function stripFences(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * LLM 응답 텍스트를 정규화된 할 일 배열로 변환한다. (순수 함수)
 * @returns {{title:string, priority:string, dueDate:string|null}[]}
 */
export function parseContent(content) {
  let data;
  try {
    data = JSON.parse(stripFences(content));
  } catch {
    throw new Error("LLM 응답을 파싱할 수 없습니다");
  }

  const list = Array.isArray(data) ? data : data?.todos;
  if (!Array.isArray(list)) {
    throw new Error("LLM 응답에 todos 배열이 없습니다");
  }

  return list
    .map((item) => ({
      title: typeof item?.title === "string" ? item.title.trim() : "",
      priority: PRIORITIES.includes(item?.priority) ? item.priority : "medium",
      dueDate: DATE_RE.test(item?.dueDate) ? item.dueDate : null,
    }))
    .filter((t) => t.title.length > 0);
}

/** MiniMax에 보낼 메시지를 만든다. today는 'YYYY-MM-DD'. */
export function buildMessages(text, today) {
  const system = [
    "너는 한국어로 자유롭게 적은 메모에서 할 일을 추출하는 도우미다.",
    `오늘 날짜는 ${today}이다. "내일", "금요일", "다음 주" 같은 상대 표현은 실제 날짜로 변환하라.`,
    "출력은 반드시 JSON 하나만. 형식: {\"todos\":[{\"title\":string,\"priority\":\"low\"|\"medium\"|\"high\",\"dueDate\":\"YYYY-MM-DD\"|null}]}",
    "한 문장에 여러 할 일이 있으면 각각 분리하라. 우선순위가 불명확하면 medium, 마감이 없으면 null.",
    "설명이나 코드펜스 없이 JSON만 출력하라.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: text },
  ];
}

/** 오늘 날짜(KST, YYYY-MM-DD)를 구한다. */
function todayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** 자유 텍스트를 MiniMax로 파싱해 할 일 배열을 반환한다. */
export async function extractTodos(text) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    const err = new Error("MINIMAX_API_KEY가 설정되지 않았습니다");
    err.status = 503;
    throw err;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: buildMessages(text, todayKST()),
        temperature: 0.2,
      }),
    });
  } catch {
    const err = new Error("LLM 서버에 연결할 수 없습니다");
    err.status = 502;
    throw err;
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message || body?.message || "";
    } catch {
      // 본문이 JSON이 아니면 무시
    }
    let message = `LLM 요청 실패 (${res.status})`;
    if (res.status === 401) message = "MiniMax API 키가 유효하지 않습니다";
    else if (res.status === 402)
      message = "MiniMax 사용 잔액이 부족합니다. 크레딧을 충전해 주세요";
    else if (detail) message = `LLM 요청 실패: ${detail}`;
    const err = new Error(message);
    err.status = 502;
    throw err;
  }

  const body = await res.json();
  const content = body?.choices?.[0]?.message?.content ?? "";
  try {
    return parseContent(content);
  } catch (e) {
    e.status = 422;
    throw e;
  }
}
