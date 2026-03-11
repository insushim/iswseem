interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API 설정 오류입니다." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: any = await request.json();
    const { message, analysisResult, age } = body;

    if (!message || !analysisResult) {
      return new Response(
        JSON.stringify({ error: "메시지와 분석 결과가 필요합니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const ageContext = age
      ? `\n사용자 나이: ${age}세. 이 나이를 고려하여 답변하세요.`
      : "";

    const prompt = `당신은 마의상법, 신상전편, 달마오결, 유장상법, 수경집 등 동양 5대 관상 고전에 정통한 전문 관상 상담사입니다.${ageContext}

## 사용자의 관상 분석 결과:
${analysisResult}

## 사용자의 질문:
${message}

## 답변 지침:
- 관상학적 전문 지식을 활용하여 구체적으로 답변
- 긍정적인 면과 주의할 점을 균형 있게 언급
- 진로 질문 시: 오행 체질 기반 구체적 직업 5개 이상 제시
- 시기 질문 시: 백세유년도 기반 구체적 나이/시기 언급
- 건강 질문 시: 기색론과 오행 체질 기반 구체적 주의점
- 4-8문장으로 충분히 상세하게
- 한국어로 답변`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return new Response(
        JSON.stringify({ error: "답변 생성 중 오류가 발생했습니다." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data: any = await geminiResponse.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "답변을 생성할 수 없습니다.";

    return new Response(JSON.stringify({ reply: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "답변 생성 중 오류가 발생했습니다." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
