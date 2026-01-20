import { chromium } from '@playwright/test';

async function testFinal() {
  console.log('🚀 최종 테스트 시작...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://isw-seem.vercel.app', { waitUntil: 'networkidle' });
    console.log('✅ 사이트 접속 완료');

    // 실제 얼굴 이미지로 테스트
    const testImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Brad_Pitt_2019_by_Glenn_Francis.jpg/440px-Brad_Pitt_2019_by_Glenn_Francis.jpg';

    const imageBase64 = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }, testImageUrl);

    console.log('📸 이미지 로드 완료');

    // API 테스트
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
    }, imageBase64);

    console.log(`📡 API 응답: ${response.status}`);

    if (response.status === 200) {
      console.log('✅ 관상 분석 성공!');
      console.log('결과 미리보기:', response.data.result?.slice(0, 300) + '...');
    } else {
      console.log('❌ 에러:', response.data.error);
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    await browser.close();
  }
}

testFinal();
