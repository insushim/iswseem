import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

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
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
