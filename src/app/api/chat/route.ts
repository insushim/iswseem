import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API 설정 오류입니다." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { message, analysisResult } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "메시지가 필요합니다." }, { status: 400 });
    }

    if (!analysisResult) {
      return NextResponse.json({ error: "관상 분석 결과가 필요합니다." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `당신은 전문 관상 상담사입니다. 사용자의 관상 분석 결과를 기반으로 추가 질문에 친절하게 답변해주세요.

## 사용자의 관상 분석 결과:
${analysisResult}

## 사용자의 질문:
${message}

## 답변 지침:
- 위의 관상 분석 결과를 참고하여 답변하세요
- 관상학적 관점에서 구체적이고 도움이 되는 조언을 제공하세요
- 친근하고 긍정적인 톤을 유지하세요
- 답변은 간결하되 핵심적인 내용을 담아주세요 (3-5문장)
- 한국어로 답변해주세요`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("Chat API error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("quota") || errorMessage.includes("rate") || errorMessage.includes("429")) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    return NextResponse.json({ error: "답변 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
