import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

// Hàm parse params từ URL
function getVnpayParamsFromUrl(url: string) {
  const params: Record<string, string> = {};
  const queryString = url.split('?')[1];
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && key.startsWith('vnp_')) {
        params[key] = decodeURIComponent(value || '');
      }
    });
  }
  return params;
}

export default function VnpayWebviewScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams();
  const webviewRef = useRef(null);

  // Xử lý khi URL thay đổi
  const handleNavigationStateChange = async (navState: any) => {
    const { url: navUrl } = navState;
    if (navUrl && navUrl.includes('vnp_')) {
      const params = getVnpayParamsFromUrl(navUrl);
      if (Object.keys(params).length > 0) {
        try {
          const accessToken = await AsyncStorage.getItem('accessToken');
          const res = await fetch('https://be-ecom-longchau-production-hehe.up.railway.app/purchase-order/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(params),
          });
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch { data = text; }
          if (res.ok && (data.success || data.data?.success)) {
            Alert.alert('Thành công', 'Đặt hàng thành công!');
            await AsyncStorage.removeItem('cart');
            router.replace('/');
          } else {
            Alert.alert('Thanh toán chưa thành công', data?.message ?? JSON.stringify(data));
          }
        } catch (e) {
          Alert.alert('Lỗi', 'Lỗi khi xác thực thanh toán!');
        }
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        source={{ uri: typeof url === 'string' ? url : '' }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}><ActivityIndicator size="large" color="#0078D4" /></View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
