import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Alert
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';
import * as ImagePicker from 'expo-image-picker';

// 스플래시 스크린 유지
SplashScreen.preventAutoHideAsync();

const WEB_URL = 'https://isw-seem.vercel.app';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 권한 요청
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const cameraGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'FaceFortune.ai 카메라 권한',
              message: '관상 분석을 위해 카메라 접근 권한이 필요합니다.',
              buttonPositive: '허용',
              buttonNegative: '거부',
            }
          );

          // Android 13+ 에서는 READ_MEDIA_IMAGES 사용
          if (Platform.Version >= 33) {
            await PermissionsAndroid.request(
              'android.permission.READ_MEDIA_IMAGES' as any,
              {
                title: 'FaceFortune.ai 갤러리 권한',
                message: '관상 분석을 위해 갤러리 접근 권한이 필요합니다.',
                buttonPositive: '허용',
                buttonNegative: '거부',
              }
            );
          } else {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              {
                title: 'FaceFortune.ai 갤러리 권한',
                message: '관상 분석을 위해 갤러리 접근 권한이 필요합니다.',
                buttonPositive: '허용',
                buttonNegative: '거부',
              }
            );
          }
        } catch (err) {
          console.warn('권한 요청 오류:', err);
        }
      } else {
        // iOS
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    };

    requestPermissions();
  }, []);

  // 뒤로가기 처리
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [canGoBack]);

  const onNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const onLoadEnd = useCallback(async () => {
    setIsLoading(false);
    await SplashScreen.hideAsync();
  }, []);

  const onError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    SplashScreen.hideAsync();
  }, []);

  const retry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  // WebView 메시지 수신 (파일 선택 요청)
  const onMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'selectImage') {
        // 이미지 선택
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
          const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
          webViewRef.current?.injectJavaScript(`
            window.receiveImageFromApp && window.receiveImageFromApp('${base64Image}');
            true;
          `);
        }
      } else if (data.type === 'captureImage') {
        // 카메라 촬영
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
          const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
          webViewRef.current?.injectJavaScript(`
            window.receiveImageFromApp && window.receiveImageFromApp('${base64Image}');
            true;
          `);
        }
      }
    } catch (error) {
      console.log('Message parsing error:', error);
    }
  }, []);

  // 파일 다운로드 처리
  const onFileDownload = useCallback((event: any) => {
    // 파일 다운로드 허용
  }, []);

  if (hasError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🔮</Text>
          <Text style={styles.errorTitle}>연결 오류</Text>
          <Text style={styles.errorMessage}>
            인터넷 연결을 확인해주세요
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // WebView에 주입할 JavaScript - 파일 input을 앱 네이티브로 연결
  const injectedJavaScript = `
    (function() {
      // 앱에서 이미지 수신 함수
      window.receiveImageFromApp = function(base64Image) {
        // 현재 페이지의 setImage 함수 호출 시도
        if (window.setImageFromApp) {
          window.setImageFromApp(base64Image);
        } else {
          // React state 직접 접근이 안되므로 input change 이벤트 시뮬레이션
          const event = new CustomEvent('appImageReceived', { detail: { image: base64Image } });
          window.dispatchEvent(event);
        }
      };

      // file input 클릭 가로채기
      document.addEventListener('click', function(e) {
        const target = e.target;

        // input[type=file] 클릭 감지
        if (target.tagName === 'INPUT' && target.type === 'file') {
          e.preventDefault();
          e.stopPropagation();

          const hasCapture = target.hasAttribute('capture');

          if (hasCapture) {
            // 카메라 촬영
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'captureImage' }));
          } else {
            // 갤러리에서 선택
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectImage' }));
          }
          return false;
        }

        // 버튼이나 div 클릭으로 input 트리거하는 경우
        const fileInput = target.closest('button, div, label');
        if (fileInput) {
          const relatedInput = document.querySelector('input[type="file"]');
          // 클릭된 요소가 파일 업로드 관련인지 확인
        }
      }, true);

      // 앱에서 받은 이미지를 처리
      window.addEventListener('appImageReceived', function(e) {
        const base64Image = e.detail.image;
        // 이미지를 localStorage에 임시 저장하고 페이지 리로드 또는 state 업데이트
        try {
          localStorage.setItem('pendingImage', base64Image);
          // 페이지에 이미지 업데이트 알림
          window.dispatchEvent(new Event('pendingImageReady'));
        } catch(err) {
          console.error('이미지 저장 실패:', err);
        }
      });

      true;
    })();
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        onNavigationStateChange={onNavigationStateChange}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onMessage={onMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        cacheEnabled={true}
        geolocationEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        allowsFullscreenVideo={true}
        onShouldStartLoadWithRequest={() => true}
        onFileDownload={onFileDownload}
        setSupportMultipleWindows={false}
        textZoom={100}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingIcon}>🔮</Text>
            <Text style={styles.loadingTitle}>FaceFortune.ai</Text>
            <ActivityIndicator size="large" color="#f59e0b" style={styles.spinner} />
            <Text style={styles.loadingText}>로딩 중...</Text>
          </View>
        )}
        userAgent="Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingIcon}>🔮</Text>
          <Text style={styles.loadingTitle}>FaceFortune.ai</Text>
          <ActivityIndicator size="large" color="#f59e0b" style={styles.spinner} />
          <Text style={styles.loadingText}>AI 관상 분석 서비스</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  retryButtonText: {
    fontSize: 18,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
});
