#!/bin/bash
# FaceFortune APK 빌드 스크립트 (WSL에서 실행)
# 사용법: bash build-apk.sh

set -e

echo "========================================="
echo "  FaceFortune.ai APK 빌드"
echo "========================================="

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "Node.js가 설치되어 있지 않습니다."
    echo "설치: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# Java 확인
if ! command -v java &> /dev/null; then
    echo "Java가 설치되어 있지 않습니다."
    echo "설치: sudo apt-get install -y openjdk-17-jdk"
    exit 1
fi

# Android SDK 확인
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
    if [ ! -d "$ANDROID_HOME" ]; then
        echo "Android SDK를 찾을 수 없습니다."
        echo "ANDROID_HOME 환경변수를 설정하거나 Android SDK를 설치해주세요."
        echo ""
        echo "설치 방법:"
        echo "  1. https://developer.android.com/studio 에서 command-line tools 다운로드"
        echo "  2. 또는: sudo apt-get install android-sdk"
        exit 1
    fi
fi

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH"

echo "1/5 의존성 설치..."
npm install

echo "2/5 Android prebuild..."
npx expo prebuild --platform android --clean

echo "3/5 Gradle 빌드..."
cd android
chmod +x gradlew
./gradlew assembleRelease

echo "4/5 APK 찾기..."
APK_PATH=$(find app/build/outputs/apk -name "*.apk" | head -1)
cd ..

if [ -z "$APK_PATH" ]; then
    echo "APK 빌드에 실패했습니다."
    exit 1
fi

# 프로젝트 루트로 복사
cp "android/$APK_PATH" "./FaceFortune.apk"

echo "5/5 완료!"
echo ""
echo "========================================="
echo "  APK 생성 완료: FaceFortune.apk"
echo "========================================="
echo ""
echo "다음 단계:"
echo "  1. APK를 핸드폰으로 전송"
echo "  2. 설정 > 보안 > 알 수 없는 출처 허용"
echo "  3. APK 실행하여 설치"
echo ""
echo "GitHub Release 배포:"
echo "  gh release create v1.1.0 FaceFortune.apk --title 'FaceFortune v1.1.0'"
