import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function testSite() {
  console.log('🚀 브라우저 테스트 시작...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 14 Pro 사이즈
  });
  const page = await context.newPage();

  try {
    // 1. 사이트 접속
    console.log('📱 사이트 접속 중...');
    await page.goto('https://isw-seem.vercel.app', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-1-homepage.png', fullPage: true });
    console.log('✅ 홈페이지 로드 완료');

    // 2. 카메라 버튼 확인
    const cameraButton = page.locator('button:has-text("카메라로 촬영하기")');
    const galleryButton = page.locator('text=갤러리에서 선택');

    const hasCameraBtn = await cameraButton.isVisible();
    const hasGalleryBtn = await galleryButton.isVisible();

    console.log(`📸 카메라 버튼: ${hasCameraBtn ? '✅' : '❌'}`);
    console.log(`🖼️ 갤러리 버튼: ${hasGalleryBtn ? '✅' : '❌'}`);

    // 3. 테스트 이미지로 API 테스트
    console.log('🔄 API 테스트 중...');

    // 간단한 테스트 이미지 (1x1 픽셀)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const response = await page.evaluate(async (imageData) => {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });
      return {
        status: res.status,
        data: await res.json()
      };
    }, testImageBase64);

    console.log(`📡 API 응답 상태: ${response.status}`);
    console.log(`📝 API 응답:`, JSON.stringify(response.data, null, 2));

    // 4. 데스크톱 뷰 테스트
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-2-desktop.png', fullPage: true });
    console.log('✅ 데스크톱 뷰 캡처 완료');

    console.log('\n🎉 테스트 완료!');
    console.log('스크린샷 파일:');
    console.log('  - test-1-homepage.png (모바일)');
    console.log('  - test-2-desktop.png (데스크톱)');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    await browser.close();
  }
}

testSite();
