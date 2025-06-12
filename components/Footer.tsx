import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Footer() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>HỖ TRỢ THANH TOÁN</Text>
          <View style={styles.paymentMethods}>
            <Image source={require('../assets/images/VnPay.png')} style={styles.paymentIcon} />
            <Image source={require('../assets/images/cod.png')} style={styles.paymentIcon} />
          </View>
        </View>
        
        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>DANH MỤC</Text>
          <TouchableOpacity onPress={() => router.push('/product-list')}>
            <Text style={styles.linkText}>Sản phẩm</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/orders')}>
            <Text style={styles.linkText}>Đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')}>
            <Text style={styles.linkText}>Tài khoản</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>KẾT NỐI VỚI CHÚNG TÔI</Text>
          <Text style={styles.contactText}>Địa chỉ: 279 Hoa Lan, P.2, Q.Phú Nhuận, TP.HCM</Text>
          <Text style={styles.contactText}>Email: support@longchau.com.vn</Text>
          <Text style={styles.contactText}>Hotline: 1800 6928</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.copyright}>© 2025 Long Châu. Tất cả các quyền được bảo lưu.</Text>
        <Text style={styles.certText}>Giấy chứng nhận ĐKKD số 0315275368 do Sở KH-ĐT TP.HCM cấp.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  topSection: {
    paddingHorizontal: 16,
  },
  supportSection: {
    marginRight: 30,
    minWidth: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentIcon: {
    width: 50,
    height: 30,
    resizeMode: 'contain',
  },
  linksSection: {
    marginTop: 20,
    marginRight: 30,
    minWidth: 150,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  contactSection: {
    marginTop: 20,
    minWidth: 250,
  },
  contactText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  copyright: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  certText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
