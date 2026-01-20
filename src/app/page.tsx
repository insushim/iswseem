"use client";

import { useState, useRef, ChangeEvent } from "react";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 이미지 압축 함수
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // 비율 유지하며 리사이즈
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError("파일 크기는 20MB 이하여야 합니다.");
        return;
      }

      try {
        setError(null);
        // 이미지 압축 (800px, 70% 품질)
        const compressedImage = await compressImage(file, 800, 0.7);
        setImage(compressedImage);
        setResult(null);
      } catch {
        setError("이미지 처리 중 오류가 발생했습니다.");
      }
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
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <header className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-4">
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
              AI 관상 분석
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-purple-200 opacity-80 px-2">
            얼굴 사진을 업로드하고 AI가 분석하는 관상을 확인해보세요
          </p>
        </header>

        <main className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border border-white/20">
          {!image ? (
            <div className="space-y-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 sm:py-5 px-6 rounded-2xl font-semibold text-lg sm:text-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <span className="text-2xl sm:text-3xl">📸</span>
                <span>카메라로 촬영하기</span>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleImageChange}
                className="hidden"
              />

              <div
                className="border-2 border-dashed border-purple-300/50 rounded-2xl p-6 sm:p-12 hover:border-purple-300 transition-colors cursor-pointer bg-white/5 active:bg-white/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4 text-center">🖼️</div>
                <p className="text-lg sm:text-xl text-white mb-2 text-center">갤러리에서 선택</p>
                <p className="text-purple-200 text-xs sm:text-sm text-center">클릭하여 사진을 선택하세요</p>
                <p className="text-purple-300/60 text-xs mt-2 text-center">JPG, PNG (최대 20MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="text-center text-purple-200/60 text-xs sm:text-sm pt-2">
                <p>💡 정면 얼굴 사진이 가장 정확한 분석 결과를 제공합니다</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-full md:w-1/3">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/20 max-w-[280px] mx-auto md:max-w-none">
                    <img
                      src={image}
                      alt="업로드된 얼굴"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2 mt-3 sm:mt-4 max-w-[280px] mx-auto md:max-w-none">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
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
                      className="bg-white/20 text-white py-3 px-3 sm:px-4 rounded-xl hover:bg-white/30 transition-all text-sm sm:text-base active:scale-[0.98]"
                    >
                      다시
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-2/3">
                  {error && (
                    <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-3 sm:px-4 py-3 rounded-xl mb-4 text-sm sm:text-base">
                      {error}
                    </div>
                  )}

                  {result ? (
                    <div className="bg-white/5 rounded-2xl p-4 sm:p-6 text-white prose prose-invert max-w-none">
                      <div
                        className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base"
                        dangerouslySetInnerHTML={{
                          __html: result
                            .replace(/## /g, "<h2 class=\"text-lg font-bold text-amber-300 mt-4 mb-2\">")
                            .replace(/### /g, "<h3 class=\"text-base font-semibold text-purple-300 mt-3 mb-1\">")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-2xl p-8 sm:p-12 text-center">
                      <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🔮</div>
                      <p className="text-purple-200 text-sm sm:text-base">
                        &quot;관상 분석하기&quot; 버튼을 눌러 AI 분석을 시작하세요
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="text-center mt-6 sm:mt-8 text-purple-300/60 text-xs sm:text-sm px-2">
          <p>* 이 서비스는 AI 기반 엔터테인먼트 목적으로 제공됩니다</p>
          <p className="mt-1">Powered by Google Gemini AI</p>
        </footer>
      </div>
    </div>
  );
}
