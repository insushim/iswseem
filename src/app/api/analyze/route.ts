import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json({ error: "API 설정 오류입니다." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    // base64 데이터 추출
    const base64Match = image.match(/^data:(.+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "이미지 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `당신은 전문 관상가입니다. 이 얼굴 사진을 분석하여 관상학적 해석을 제공해주세요.

다음 형식으로 답변해주세요:

## 🔮 전체 운세 요약
(전반적인 인상과 운세를 2-3문장으로 요약)

## 👤 이목구비 분석

### 이마
- 특징:
- 해석:

### 눈
- 특징:
- 해석:

### 코
- 특징:
- 해석:

### 입
- 특징:
- 해석:

### 턱/얼굴형
- 특징:
- 해석:

## 💼 사업/재물운
(재물운과 사업 성공 가능성에 대한 분석)

## 💕 연애/대인운
(대인관계와 연애운에 대한 분석)

## 🌟 조언
(삶에서 주의할 점이나 장점을 살리는 조언)

친근하고 긍정적인 톤으로 작성해주세요. 한국어로 답변해주세요.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("API_KEY")) {
      return NextResponse.json({ error: "API 키가 유효하지 않습니다." }, { status: 500 });
    }
    if (errorMessage.includes("SAFETY")) {
      return NextResponse.json({ error: "이미지를 분석할 수 없습니다. 다른 사진을 시도해주세요." }, { status: 400 });
    }
    if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    return NextResponse.json(
      { error: `분석 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
