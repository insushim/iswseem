import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API 설정 오류입니다." },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { message, analysisResult, age } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "메시지가 필요합니다." },
        { status: 400 },
      );
    }

    if (!analysisResult) {
      return NextResponse.json(
        { error: "관상 분석 결과가 필요합니다." },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const ageContext = age
      ? `\n사용자 나이: ${age}세. 이 나이를 고려하여 답변하세요.`
      : "";

    const prompt = `당신은 마의상법, 신상전편, 달마오결, 유장상법, 수경집 등 동양 5대 관상 고전에 정통한 전문 관상 상담사입니다. 사용자의 관상 분석 결과를 기반으로 추가 질문에 답변합니다.${ageContext}

## 사용자의 관상 분석 결과:
${analysisResult}

## 사용자의 질문:
${message}

## 답변 지침:
- 위의 관상 분석 결과를 참고하되, 관상학적 전문 지식을 추가로 활용하여 답변
- 긍정적인 면과 주의할 점을 균형 있게 언급 (장점만 나열하지 마세요)
- 진로/직업 질문 시: 오행 체질과 이목구비 분석 기반으로 구체적 직업 5개 이상 제시
- 시기/운세 질문 시: 백세유년도 기반으로 구체적 나이/시기 언급
- 건강 질문 시: 기색론과 오행 체질 기반으로 구체적 장기/질환 주의점 언급
- 실용적이고 구체적인 조언 제공 (추상적 격려 X)
- 답변은 4-8문장으로 충분히 상세하게
- 한국어로 답변`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("Chat API error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("quota") ||
      errorMessage.includes("rate") ||
      errorMessage.includes("429")
    ) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "답변 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
