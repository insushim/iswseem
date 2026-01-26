"use client";

import { useState, useRef, ChangeEvent, FormEvent, useCallback, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SavedReading {
  id: string;
  date: string;
  thumbnail: string;
  result: string;
}

// 카카오톡 인앱 브라우저 감지
const isKakaoInApp = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf("kakaotalk") !== -1;
};

// 안전한 localStorage 접근
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.error("localStorage 읽기 실패:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.error("localStorage 쓰기 실패:", e);
    }
  }
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [isKakao, setIsKakao] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 챗봇 상태
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // TTS 상태
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 저장 히스토리 상태
  const [savedReadings, setSavedReadings] = useState<SavedReading[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
    setIsKakao(isKakaoInApp());

    // PWA 서비스 워커 등록
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(function() {});
    }

    // Expo 앱에서 이미지 수신 함수 등록
    if (typeof window !== "undefined") {
      (window as any).setImageFromApp = function(base64Image: string) {
        setImage(base64Image);
        setResult(null);
        setChatMessages([]);
      };

      // 앱에서 이미지 받는 이벤트 리스너
      var handleAppImage = function(e: any) {
        var base64Image = e.detail ? e.detail.image : null;
        if (base64Image) {
          setImage(base64Image);
          setResult(null);
          setChatMessages([]);
        }
      };
      window.addEventListener("appImageReceived", handleAppImage as any);

      // pendingImage 체크
      var handlePendingImage = function() {
        var pending = safeLocalStorage.getItem("pendingImage");
        if (pending) {
          setImage(pending);
          setResult(null);
          setChatMessages([]);
          safeLocalStorage.setItem("pendingImage", "");
        }
      };
      window.addEventListener("pendingImageReady", handlePendingImage);

      // 초기 pendingImage 체크
      handlePendingImage();

      return function() {
        window.removeEventListener("appImageReceived", handleAppImage as any);
        window.removeEventListener("pendingImageReady", handlePendingImage);
      };
    }
  }, []);

  // localStorage에서 히스토리 불러오기 (마운트 후)
  useEffect(() => {
    if (!mounted) return;

    const saved = safeLocalStorage.getItem("faceReadingHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedReadings(parsed);
        }
      } catch (e) {
        console.error("히스토리 파싱 실패:", e);
      }
    }
  }, [mounted]);

  // 이미지 압축 함수
  const compressImage = function(file: File, maxWidth: number, quality: number): Promise<string> {
    maxWidth = maxWidth || 800;
    quality = quality || 0.7;

    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement("canvas");
          var width = img.width;
          var height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          var ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          var compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
        img.onerror = function() { reject(new Error("Image load failed")); };
        var result = e.target ? e.target.result : null;
        img.src = result as string;
      };
      reader.onerror = function() { reject(new Error("File read failed")); };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = function(e: ChangeEvent<HTMLInputElement>) {
    var files = e.target.files;
    var file = files ? files[0] : null;
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError("파일 크기는 20MB 이하여야 합니다.");
        return;
      }

      setError(null);
      compressImage(file, 800, 0.7)
        .then(function(compressedImage) {
          setImage(compressedImage);
          setResult(null);
          setChatMessages([]);
        })
        .catch(function() {
          setError("이미지 처리 중 오류가 발생했습니다.");
        });
    }
  };

  // 자동 저장 함수 (알림 없이)
  const autoSaveToHistory = useCallback(function(analysisResult: string, imageData: string) {
    var newReading: SavedReading = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("ko-KR"),
      thumbnail: imageData,
      result: analysisResult,
    };

    setSavedReadings(function(prev) {
      var updatedReadings = [newReading].concat(prev).slice(0, 20);
      safeLocalStorage.setItem("faceReadingHistory", JSON.stringify(updatedReadings));
      return updatedReadings;
    });
  }, []);

  const handleAnalyze = function() {
    if (!image) return;

    setLoading(true);
    setError(null);

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: image }),
    })
      .then(function(response) {
        return response.json().then(function(data) {
          if (!response.ok) {
            throw new Error(data.error || "분석 실패");
          }
          return data;
        });
      })
      .then(function(data) {
        setResult(data.result);
        setChatMessages([]);
        autoSaveToHistory(data.result, image);
      })
      .catch(function(err) {
        setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
      })
      .finally(function() {
        setLoading(false);
      });
  };

  const handleReset = function() {
    setImage(null);
    setResult(null);
    setError(null);
    setChatMessages([]);
    setChatInput("");
    stopSpeaking();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // 텍스트 정리 함수
  const getCleanText = useCallback(function(text: string) {
    return text
      .replace(/##\s*/g, "\n\n★ ")
      .replace(/###\s*/g, "\n• ")
      .replace(/\*\*/g, "")
      .replace(/-\s+/g, "  · ");
  }, []);

  // 히스토리에 저장
  const saveToHistory = useCallback(function() {
    if (!result || !image) return;

    var newReading: SavedReading = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("ko-KR"),
      thumbnail: image,
      result: result,
    };

    var updatedReadings = [newReading].concat(savedReadings).slice(0, 20);
    setSavedReadings(updatedReadings);
    safeLocalStorage.setItem("faceReadingHistory", JSON.stringify(updatedReadings));
    alert("관상 분석 결과가 저장되었습니다!\n저장 내역에서 확인할 수 있습니다.");
    setShowSaveOptions(false);
  }, [result, image, savedReadings]);

  // 히스토리에서 삭제
  const deleteFromHistory = useCallback(function(id: string) {
    var updatedReadings = savedReadings.filter(function(r) { return r.id !== id; });
    setSavedReadings(updatedReadings);
    safeLocalStorage.setItem("faceReadingHistory", JSON.stringify(updatedReadings));
  }, [savedReadings]);

  // 히스토리에서 불러오기
  const loadFromHistory = useCallback(function(reading: SavedReading) {
    setImage(reading.thumbnail);
    setResult(reading.result);
    setChatMessages([]);
    setShowHistory(false);
  }, []);

  // 클립보드에 복사
  const copyToClipboard = useCallback(function() {
    if (!result) return;

    var cleanText = getCleanText(result);
    var fullText = "FaceFortune.ai 관상 분석 결과\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      cleanText +
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "FaceFortune.ai - AI 관상 분석 서비스\n" +
      "https://isw-seem.vercel.app";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText)
        .then(function() {
          alert("관상 결과가 클립보드에 복사되었습니다!\n메모장이나 카톡에 붙여넣기 하세요.");
          setShowSaveOptions(false);
        })
        .catch(function() {
          alert("클립보드 복사에 실패했습니다. 다른 저장 방법을 시도해주세요.");
        });
    } else {
      alert("이 브라우저에서는 클립보드 복사가 지원되지 않습니다.");
    }
  }, [result, getCleanText]);

  // 텍스트 파일로 다운로드
  const downloadAsText = useCallback(function() {
    if (!result) return;

    var cleanText = getCleanText(result);
    var fullText = "FaceFortune.ai 관상 분석 결과\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      cleanText +
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "FaceFortune.ai - AI 관상 분석 서비스\n" +
      "https://isw-seem.vercel.app";

    var blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "facefortune-" + new Date().toISOString().slice(0,10) + ".txt";
    link.click();
    URL.revokeObjectURL(url);
    setShowSaveOptions(false);
  }, [result, getCleanText]);

  // JSON으로 다운로드 (이미지 포함)
  const downloadAsJson = useCallback(function() {
    if (!result || !image) return;

    var data = {
      date: new Date().toISOString(),
      image: image,
      result: result,
      source: "FaceFortune.ai"
    };

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "facefortune-" + new Date().toISOString().slice(0,10) + ".json";
    link.click();
    URL.revokeObjectURL(url);
    setShowSaveOptions(false);
  }, [result, image]);

  // 기존 저장 버튼
  const handleSaveResult = useCallback(function() {
    if (!result) return;
    setShowSaveOptions(true);
  }, [result]);

  // 네이티브 앱 환경 감지
  const [isNativeApp, setIsNativeApp] = useState(false);

  // 네이티브 앱 감지 및 TTS 상태 이벤트 리스너
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 네이티브 앱 환경 감지
    var checkNativeApp = function() {
      setIsNativeApp(!!(window as any).isNativeApp || !!(window as any).ReactNativeWebView);
    };

    // 초기 체크
    checkNativeApp();

    // 약간의 딜레이 후 재체크 (injectedJS가 실행되는 시간 고려)
    var timeout = setTimeout(checkNativeApp, 500);

    // 네이티브 TTS 상태 변경 리스너
    var handleTTSStateChange = function(e: any) {
      var speaking = e.detail ? e.detail.speaking : false;
      setIsSpeaking(speaking);
    };
    window.addEventListener("nativeTTSStateChange", handleTTSStateChange);

    return function() {
      clearTimeout(timeout);
      window.removeEventListener("nativeTTSStateChange", handleTTSStateChange);
    };
  }, []);

  // TTS 기능
  const speakResult = useCallback(function() {
    if (!result || typeof window === "undefined") return;

    // 카카오톡 인앱 브라우저에서는 외부 브라우저 안내
    if (isKakao) {
      alert("카카오톡 내 브라우저에서는 음성 읽기가 지원되지 않습니다.\n\n우측 상단 메뉴에서 다른 브라우저로 열기를 선택해주세요.");
      return;
    }

    var cleanText = result
      .replace(/##\s*/g, ". ")
      .replace(/###\s*/g, ". ")
      .replace(/\*\*/g, "")
      .replace(/-\s+/g, " ")
      .replace(/\n+/g, " ");

    // 네이티브 앱 환경에서는 네이티브 TTS 사용
    if (isNativeApp && (window as any).nativeSpeak) {
      if (isSpeaking) {
        (window as any).nativeStopSpeaking();
      } else {
        (window as any).nativeSpeak(cleanText);
      }
      return;
    }

    // 웹 브라우저 환경
    if (!window.speechSynthesis) {
      alert("이 브라우저에서는 음성 읽기가 지원되지 않습니다.");
      return;
    }

    var synth = window.speechSynthesis;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    var utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ko-KR";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = function() { setIsSpeaking(false); };
    utterance.onerror = function() { setIsSpeaking(false); };

    setIsSpeaking(true);
    synth.speak(utterance);
  }, [result, isSpeaking, isKakao, isNativeApp]);

  const stopSpeaking = function() {
    if (typeof window === "undefined") return;

    // 네이티브 앱 환경
    if (isNativeApp && (window as any).nativeStopSpeaking) {
      (window as any).nativeStopSpeaking();
      return;
    }

    // 웹 브라우저 환경
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // 챗봇 메시지 전송
  const handleChatSubmit = function(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !result || chatLoading) return;

    var userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(function(prev) { return prev.concat([{ role: "user", content: userMessage }]); });
    setChatLoading(true);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, analysisResult: result }),
    })
      .then(function(response) {
        return response.json().then(function(data) {
          if (!response.ok) {
            throw new Error(data.error || "답변 생성 실패");
          }
          return data;
        });
      })
      .then(function(data) {
        setChatMessages(function(prev) { return prev.concat([{ role: "assistant", content: data.reply }]); });
      })
      .catch(function(err) {
        setChatMessages(function(prev) {
          return prev.concat([{ role: "assistant", content: err instanceof Error ? err.message : "답변 생성 중 오류가 발생했습니다." }]);
        });
      })
      .finally(function() {
        setChatLoading(false);
        setTimeout(function() {
          if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      });
  };

  var quickQuestions = ["올해 재물운은 어때요?", "연애운이 궁금해요", "직장 운세는요?", "건강 관련 조언 주세요"];

  // 로딩 중일 때 빈 화면 방지
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-indigo-950/30 to-slate-950/50" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
        {/* 헤더 */}
        <header className="text-center mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 text-xs sm:text-sm mb-4">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            AI 기반 관상 분석 서비스
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-3 tracking-tight">
            <span className="text-amber-400">
              FaceFortune
            </span>
            <span className="text-white">.ai</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
            당신의 얼굴에서 운명을 읽어드립니다
          </p>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-3xl p-5 sm:p-10 shadow-2xl border border-white/10">
          {!image ? (
            <div className="space-y-6">
              {/* 촬영 가이드 */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
                <h3 className="text-amber-300 font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  정확한 분석을 위한 촬영 가이드
                </h3>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span><strong className="text-white">정면</strong>을 바라보고, 얼굴 전체가 화면에 나오게 해주세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span><strong className="text-white">이마 전체</strong>가 보이도록 머리카락을 정리해주세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span><strong className="text-white">양쪽 귀</strong>가 보이면 더 정확한 분석이 가능합니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span><strong className="text-white">밝은 조명</strong> 아래에서 그림자 없이 촬영해주세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">✓</span>
                    <span><strong className="text-white">안경, 모자</strong>는 벗고 자연스러운 표정으로 촬영해주세요</span>
                  </li>
                </ul>
              </div>

              {/* 업로드 버튼들 */}
              <button
                onClick={function() { if (cameraInputRef.current) cameraInputRef.current.click(); }}
                className="w-full group relative bg-gradient-to-r from-amber-500 to-orange-500 text-white py-5 px-8 rounded-2xl font-bold text-lg overflow-hidden transition-all hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  카메라로 촬영하기
                </span>
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleImageChange} className="hidden" />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0a0a1a] text-slate-500">또는</span>
                </div>
              </div>

              <div
                className="border-2 border-dashed border-white/10 rounded-2xl p-10 hover:border-amber-500/30 hover:bg-white/[0.02] transition-all cursor-pointer group"
                onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-lg text-white font-medium mb-1">갤러리에서 선택</p>
                  <p className="text-slate-500 text-sm">클릭하여 이미지 선택 - JPG, PNG (최대 20MB)</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* 이미지 영역 */}
                <div className="w-full lg:w-2/5">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 ring-2 ring-white/10">
                    <img src={image} alt="업로드된 얼굴" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          분석 중...
                        </span>
                      ) : (
                        "관상 분석하기"
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="bg-white/5 hover:bg-white/10 text-white py-3.5 px-4 rounded-xl transition-all border border-white/10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 결과 영역 */}
                <div className="w-full lg:w-3/5">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {result ? (
                    <div className="space-y-4">
                      {/* 액션 버튼들 */}
                      <div className="flex gap-2 flex-wrap">
                        <div className="relative">
                          <button
                            onClick={handleSaveResult}
                            className="inline-flex items-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-violet-500/20"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            저장하기
                          </button>

                          {/* 저장 옵션 드롭다운 */}
                          {showSaveOptions && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                              <div className="p-2 space-y-1">
                                <button
                                  onClick={saveToHistory}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                  <span className="text-lg">💾</span>
                                  <div>
                                    <div className="font-medium">앱에 저장</div>
                                    <div className="text-xs text-slate-400">히스토리에 보관</div>
                                  </div>
                                </button>
                                <button
                                  onClick={copyToClipboard}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                  <span className="text-lg">📋</span>
                                  <div>
                                    <div className="font-medium">클립보드 복사</div>
                                    <div className="text-xs text-slate-400">텍스트만 복사</div>
                                  </div>
                                </button>
                                <button
                                  onClick={downloadAsText}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                  <span className="text-lg">📄</span>
                                  <div>
                                    <div className="font-medium">TXT 다운로드</div>
                                    <div className="text-xs text-slate-400">텍스트 파일</div>
                                  </div>
                                </button>
                                <button
                                  onClick={downloadAsJson}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                  <span className="text-lg">📦</span>
                                  <div>
                                    <div className="font-medium">JSON 다운로드</div>
                                    <div className="text-xs text-slate-400">이미지 포함</div>
                                  </div>
                                </button>
                              </div>
                              <div className="border-t border-white/10 p-2">
                                <button
                                  onClick={function() { setShowSaveOptions(false); }}
                                  className="w-full text-center text-sm text-slate-400 hover:text-white py-2 transition-all"
                                >
                                  닫기
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={function() { setShowHistory(true); }}
                          className="inline-flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-indigo-500/20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          저장 내역 ({savedReadings.length})
                        </button>
                        <button
                          onClick={speakResult}
                          className={"inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border " + (
                            isSpeaking
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20"
                          )}
                        >
                          {isSpeaking ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                              </svg>
                              읽기 중지
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                              음성으로 듣기
                            </>
                          )}
                        </button>
                      </div>

                      {/* 결과 내용 */}
                      <div className="bg-black/20 rounded-2xl p-5 sm:p-6 text-white max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="text-sm sm:text-base leading-relaxed space-y-4">
                          {result.split(/\n(?=## )/).map(function(section, sectionIdx) {
                            var lines = section.split("\n");
                            return (
                              <div key={sectionIdx} className="space-y-2">
                                {lines.map(function(line, lineIdx) {
                                  if (line.indexOf("## ") === 0) {
                                    return <h2 key={lineIdx} className="text-lg font-bold text-amber-300 mt-4 mb-2">{line.replace("## ", "")}</h2>;
                                  }
                                  if (line.indexOf("### ") === 0) {
                                    return <h3 key={lineIdx} className="text-base font-semibold text-violet-300 mt-3 mb-1">{line.replace("### ", "")}</h3>;
                                  }
                                  if (line.indexOf("- ") === 0) {
                                    return <p key={lineIdx} className="text-slate-300 pl-2">{line}</p>;
                                  }
                                  if (line.trim() === "") return null;
                                  return <p key={lineIdx} className="text-slate-200">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/20 rounded-2xl p-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <p className="text-slate-400">&quot;관상 분석하기&quot; 버튼을 눌러<br />AI 분석을 시작하세요</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI 챗봇 섹션 */}
              {result && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">관상 상담 챗봇</h2>
                      <p className="text-slate-400 text-sm">분석 결과를 바탕으로 더 궁금한 점을 물어보세요</p>
                    </div>
                  </div>

                  {/* 빠른 질문 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quickQuestions.map(function(q, idx) {
                      return (
                        <button
                          key={idx}
                          onClick={function() { setChatInput(q); }}
                          className="bg-white/5 hover:bg-white/10 text-slate-300 text-sm px-4 py-2 rounded-full transition-all border border-white/5 hover:border-white/10"
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>

                  {/* 채팅 영역 */}
                  <div className="bg-black/30 rounded-2xl p-4 max-h-[300px] overflow-y-auto mb-4 custom-scrollbar">
                    {chatMessages.length === 0 ? (
                      <p className="text-slate-500 text-center text-sm py-8">
                        질문을 입력하거나 빠른 질문을 선택해주세요
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map(function(msg, idx) {
                          return (
                            <div key={idx} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
                              <div
                                className={"max-w-[85%] px-4 py-2.5 rounded-2xl text-sm " + (
                                  msg.role === "user"
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-md"
                                    : "bg-white/10 text-slate-200 rounded-bl-md"
                                )}
                              >
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white/10 text-slate-300 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
                              <span className="flex items-center gap-2">
                                <span className="flex gap-1">
                                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>

                  {/* 입력 폼 */}
                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={function(e) { setChatInput(e.target.value); }}
                      placeholder="궁금한 점을 물어보세요..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 text-sm"
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>

        {/* 푸터 */}
        <footer className="text-center mt-10 space-y-2">
          <p className="text-slate-500 text-sm">본 서비스는 AI 기반 엔터테인먼트 목적으로 제공됩니다</p>
          <p className="text-slate-600 text-xs">Powered by Google Gemini AI - FaceFortune.ai</p>
        </footer>
      </div>

      {/* 히스토리 모달 */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-white/10 shadow-2xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📚</span> 저장된 관상 기록
              </h2>
              <button
                onClick={function() { setShowHistory(false); }}
                className="text-slate-400 hover:text-white transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {savedReadings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔮</div>
                  <p className="text-slate-400">아직 저장된 관상 기록이 없습니다</p>
                  <p className="text-slate-500 text-sm mt-2">사진을 분석하면 자동으로 저장됩니다</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedReadings.map(function(reading) {
                    return (
                      <div
                        key={reading.id}
                        className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-amber-500/30 transition-all group"
                      >
                        <div className="flex gap-4">
                          {/* 썸네일 */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black/30">
                            <img
                              src={reading.thumbnail}
                              alt="관상 사진"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* 정보 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-400 text-sm mb-1">{reading.date}</p>
                            <p className="text-white text-sm line-clamp-2">
                              {reading.result.substring(0, 100)}...
                            </p>
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={function() {
                                loadFromHistory(reading);
                                setShowHistory(false);
                              }}
                              className="bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
                            >
                              보기
                            </button>
                            <button
                              onClick={function() { deleteFromHistory(reading.id); }}
                              className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            {savedReadings.length > 0 && (
              <div className="p-4 border-t border-white/10 text-center">
                <p className="text-slate-500 text-sm">
                  총 {savedReadings.length}개의 기록 - 최대 20개까지 저장됩니다
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 커스텀 스크롤바 스타일 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      ` }} />
    </div>
  );
}
