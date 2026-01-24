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

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `당신은 30년 경력의 전문 관상가이자 동양 철학 연구가입니다. 이 얼굴 사진을 깊이 있게 분석하여 상세한 관상학적 해석을 제공해주세요.

다음 형식으로 상세하게 답변해주세요:

## 🔮 전체 운세 요약
(첫인상에서 느껴지는 기운, 전반적인 운의 흐름, 타고난 복과 운명의 방향성을 4-5문장으로 상세히 설명)

## 👤 이목구비 분석

### 이마 (관록궁 - 사회운, 지성)
- 형태와 특징: (이마의 넓이, 높이, 모양, 이마선, 주름 유무 등을 상세히)
- 관상학적 해석: (초년운, 지적 능력, 사회적 성공 가능성, 부모운 등)
- 운세 시기: (10대~30대 초반까지의 운세 흐름)

### 눈 (감찰궁 - 지혜, 의지력)
- 형태와 특징: (눈의 크기, 모양, 눈매, 눈동자, 흰자위 비율, 눈꺼풀 등)
- 관상학적 해석: (성격, 지혜, 판단력, 이성운, 재물 보는 눈 등)
- 특별한 상: (용의 눈, 봉황의 눈, 호랑이 눈 등 해당되는 경우)

### 코 (재백궁 - 재물운, 자아)
- 형태와 특징: (콧대 높이, 콧방울 크기, 코끝 모양, 코 전체 비율 등)
- 관상학적 해석: (재물운, 사업 능력, 자존심, 건강운 등)
- 40대 운세: (코는 40대 중년운을 나타냄)

### 입 (출납궁 - 언변, 식복)
- 형태와 특징: (입술 두께, 입 크기, 입꼬리 방향, 인중 모양 등)
- 관상학적 해석: (언변, 식복, 애정운, 자녀운, 말년 복 등)
- 50대 이후 운세: (입은 말년운과 연결)

### 턱/얼굴형 (지각 - 말년운, 의지)
- 형태와 특징: (턱선, 광대뼈, 얼굴 전체 비율, 얼굴형 등)
- 관상학적 해석: (말년운, 부동산운, 부하운, 끈기와 의지력 등)
- 인생 후반부 전망: (노후와 자손 복)

### 귀 (채청궁 - 수명, 지혜) - 보이는 경우
- 형태와 특징: (귀 크기, 귓볼, 귀 위치 등)
- 관상학적 해석: (수명, 어린 시절, 지혜, 재물 복 등)

## 💼 사업/재물운
(재물을 모으는 능력, 사업 성공 가능성, 적합한 직업 분야, 재물이 들어오는 시기와 방향, 투자 성향, 동업 적합성 등을 상세히 4-5문장으로 분석)

## 💕 연애/대인운
(연애 스타일, 이상형, 결혼 시기, 배우자운, 자녀운, 친구운, 직장 내 인간관계 등을 상세히 4-5문장으로 분석)

## 🏥 건강운
(관상으로 보이는 건강상 주의할 부분, 장수 가능성, 특별히 관리해야 할 신체 부위 등을 3-4문장으로 분석)

## ✨ 타고난 강점과 복
(이 관상이 가진 특별한 장점, 타고난 복, 성공할 수 있는 분야, 특별한 재능이나 능력을 4-5가지 구체적으로 제시)

## 🌱 성장을 위한 보완점
(더 좋은 운을 만들기 위해 보완하면 좋을 부분들을 긍정적인 관점에서 제시. 관상은 바뀔 수 있다는 점을 강조하며, 표정 관리, 마인드셋, 생활 습관, 인간관계 등에서 실천 가능한 구체적인 조언을 5-6가지 제시)

## 🎯 인생 조언
(관상에서 보이는 잠재력을 최대한 발휘하기 위한 삶의 방향, 특히 신경 써야 할 시기와 기회를 잡는 방법, 피해야 할 상황 등을 상세히 조언)

## 🌟 종합 운세 점수
- 재물운: ⭐⭐⭐⭐⭐ (5점 만점 중 X점)
- 사업운: ⭐⭐⭐⭐⭐ (5점 만점 중 X점)
- 연애운: ⭐⭐⭐⭐⭐ (5점 만점 중 X점)
- 건강운: ⭐⭐⭐⭐⭐ (5점 만점 중 X점)
- 대인운: ⭐⭐⭐⭐⭐ (5점 만점 중 X점)

## 💫 마무리 한마디
(격려와 희망을 주는 따뜻한 마무리 멘트)

따뜻하고 희망적인 톤으로 작성하되, 전문적이고 신뢰감 있게 분석해주세요. 부정적인 표현보다는 "더 발전할 수 있는 부분", "보완하면 좋을 점" 등 긍정적인 표현을 사용해주세요. 한국어로 답변해주세요.`;

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

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error || {}));
    console.error("Error details:", errorStr);

    if (errorMessage.includes("API_KEY") || errorMessage.includes("API key")) {
      return NextResponse.json({ error: "API 키가 유효하지 않습니다." }, { status: 500 });
    }
    if (errorMessage.includes("SAFETY") || errorMessage.includes("blocked")) {
      return NextResponse.json({ error: "이미지를 분석할 수 없습니다. 다른 사진을 시도해주세요." }, { status: 400 });
    }
    if (errorMessage.includes("not valid") || errorMessage.includes("invalid image")) {
      return NextResponse.json({ error: "이미지가 너무 작거나 손상되었습니다. 다른 사진을 시도해주세요." }, { status: 400 });
    }
    if (errorMessage.includes("quota") || errorMessage.includes("rate") || errorMessage.includes("429") || errorMessage.includes("Resource")) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 1분 후 다시 시도해주세요." }, { status: 429 });
    }
    if (errorMessage.includes("not found") || errorMessage.includes("404")) {
      return NextResponse.json({ error: "API 모델을 찾을 수 없습니다." }, { status: 500 });
    }

    return NextResponse.json(
      { error: `분석 오류: ${errorMessage.slice(0, 100)}` },
      { status: 500 }
    );
  }
}
