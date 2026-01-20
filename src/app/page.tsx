"use client";

import { useState, useRef, ChangeEvent } from "react";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("파일 크기는 10MB 이하여야 합니다.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "분석 실패");
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
              AI 관상 분석
            </span>
          </h1>
          <p className="text-lg text-purple-200 opacity-80">
            얼굴 사진을 업로드하고 AI가 분석하는 관상을 확인해보세요
          </p>
        </header>

        <main className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          {!image ? (
            <div className="text-center">
              <div
                className="border-3 border-dashed border-purple-300/50 rounded-2xl p-12 hover:border-purple-300 transition-colors cursor-pointer bg-white/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-6xl mb-4">📷</div>
                <p className="text-xl text-white mb-2">얼굴 사진을 업로드하세요</p>
                <p className="text-purple-200 text-sm">클릭하거나 파일을 드래그하세요</p>
                <p className="text-purple-300/60 text-xs mt-2">JPG, PNG (최대 10MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/3">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/20">
                    <img
                      src={image}
                      alt="업로드된 얼굴"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">🔮</span>
                          분석 중...
                        </span>
                      ) : (
                        "관상 분석하기"
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="bg-white/20 text-white py-3 px-4 rounded-xl hover:bg-white/30 transition-all"
                    >
                      다시
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-2/3">
                  {error && (
                    <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-4">
                      {error}
                    </div>
                  )}

                  {result ? (
                    <div className="bg-white/5 rounded-2xl p-6 text-white prose prose-invert max-w-none">
                      <div
                        className="whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: result
                            .replace(/## /g, '<h2 class="text-xl font-bold text-amber-300 mt-6 mb-3">')
                            .replace(/### /g, '<h3 class="text-lg font-semibold text-purple-300 mt-4 mb-2">')
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-2xl p-12 text-center">
                      <div className="text-4xl mb-4">🔮</div>
                      <p className="text-purple-200">
                        &quot;관상 분석하기&quot; 버튼을 눌러 AI 분석을 시작하세요
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="text-center mt-8 text-purple-300/60 text-sm">
          <p>* 이 서비스는 AI 기반 엔터테인먼트 목적으로 제공됩니다</p>
          <p className="mt-1">Powered by Google Gemini AI</p>
        </footer>
      </div>
    </div>
  );
}
