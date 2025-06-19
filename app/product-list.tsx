import Footer from '@/components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Product {
  id: string;
  masanpham: string;
  tensanpham: string;
  anhsanpham: { url: string; ismain?: boolean | null }[];
  chitietdonvi: {
    dinhluong: number;
    giaban: number;
    donvitinh: { donvitinh: string };
    giabanSauKhuyenMai?: number;
  }[];
  khuyenmai?: {
    tenchuongtrinh: string;
    giatrikhuyenmai?: number;
  };
  gianhap: number;
  thuockedon: boolean; // Thêm trường này
}

export default function ProductListScreen() {
  const navigation = useNavigation();
  const { madanhmuc, tendanhmuc } = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    navigation.setOptions?.({ title: tendanhmuc || 'Danh sách sản phẩm' });
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `https://be-ecom-longchau-production-hehe.up.railway.app/product/findProductsByCategory/${madanhmuc}`
        );
        const json = await res.json();
        setProducts(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [madanhmuc]);

  // Sắp xếp sản phẩm theo giá của đơn vị đầu tiên (hoặc 0 nếu không có)
  const sortedProducts = [...products].sort((a, b) => {
    const priceA = a.chitietdonvi?.[0]?.giaban ?? 0;
    const priceB = b.chitietdonvi?.[0]?.giaban ?? 0;
    return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
  });

  // Tách ProductCard ra ngoài để dùng hook đúng quy tắc
  function ProductCard({ item }: { item: Product }) {
    const [selectedUnitIdx, setSelectedUnitIdx] = React.useState(0);
    const units = item.chitietdonvi || [];
    const selectedUnit = units[selectedUnitIdx] || units[0];
    const router = require('expo-router').useRouter();
    // Không return null nữa, luôn render card
    // Ưu tiên lấy ảnh có ismain === true, nếu không có thì lấy ảnh đầu tiên
    let imageUrl = undefined;
    if (item.anhsanpham && item.anhsanpham.length > 0) {
      const mainImg = item.anhsanpham.find(img => img.ismain === true);
      imageUrl = mainImg ? mainImg.url : item.anhsanpham[0].url;
    }
    
    // Tính phần trăm giảm giá nếu có
    let discountPercent = 0;
    if (selectedUnit?.giabanSauKhuyenMai && selectedUnit.giaban > selectedUnit.giabanSauKhuyenMai) {
      discountPercent = Math.round(((selectedUnit.giaban - selectedUnit.giabanSauKhuyenMai) / selectedUnit.giaban) * 100);
    }
    
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push({ pathname: '/product-detail', params: { masanpham: item.masanpham } })}>
        {discountPercent > 0 && (
          <View style={styles.discountTag}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../assets/images/danhmuc.webp')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.productName} numberOfLines={2}>{item.tensanpham}</Text>
        {/* Đơn vị tính dạng tab hoặc thông báo không rõ */}
        {units.length > 0 ? (
          <View style={{ flexDirection: 'row', marginBottom: 6, marginTop: 2 }}>
            {units.map((unit, idx) => (
              <TouchableOpacity
                key={unit.donvitinh.donvitinh}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: idx === selectedUnitIdx ? '#0078D4' : '#f2f2f2',
                  marginRight: 6,
                }}
                onPress={(e) => { e.stopPropagation(); setSelectedUnitIdx(idx); }}
                activeOpacity={0.7}
              >
                <Text style={{ color: idx === selectedUnitIdx ? '#fff' : '#333', fontWeight: 'bold', fontSize: 13 }}>
                  {unit.donvitinh.donvitinh}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: '#888', marginBottom: 6, marginTop: 2 }}>Đơn vị tính: Không rõ</Text>
        )}
        <View style={styles.priceRow}>
          {selectedUnit?.giabanSauKhuyenMai ? (
            <>
              <Text style={styles.oldPrice}>{selectedUnit.giaban.toLocaleString()}đ</Text>
              <Text style={styles.price}>{selectedUnit.giabanSauKhuyenMai.toLocaleString()}đ</Text>
            </>
          ) : (
            <Text style={styles.price}>{selectedUnit ? selectedUnit.giaban.toLocaleString() + 'đ' : 'Không rõ'}</Text>
          )}
        </View>
        <Text style={styles.unit}>/ {selectedUnit ? selectedUnit.donvitinh.donvitinh : 'Không rõ'}</Text>
        <Text style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          {units.length > 1 ? `Hộp ${units.map(u => u.dinhluong + ' ' + u.donvitinh.donvitinh).join(' | ')}` : ''}
        </Text>
        <TouchableOpacity style={styles.buyButton} onPress={async e => {
          e.stopPropagation();
          // Kiểm tra đăng nhập
          const userPhone = await AsyncStorage.getItem('userPhone');
          if (!userPhone) {
            Alert.alert(
              'Yêu cầu đăng nhập',
              'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng',
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng nhập', onPress: () => router.push('/login') }
              ]
            );
            return;
          }

          try {
            // Lấy giỏ hàng hiện tại
            const cartStr = await AsyncStorage.getItem('cart');
            let cart = [];
            try { cart = cartStr ? JSON.parse(cartStr) : []; } catch { cart = []; }

            // Tìm ảnh chính
            const mainImage = item.anhsanpham?.find(img => img.ismain === true)?.url ?? 
                            item.anhsanpham?.[0]?.url ?? '';

            // Tạo ID duy nhất dựa trên mã sản phẩm và đơn vị tính
            const cartItemId = `${item.masanpham}-${selectedUnit.donvitinh.donvitinh}`;
            
            // Kiểm tra đã có sản phẩm với ID này trong giỏ chưa
            const idx = cart.findIndex((p: any) => p.id === cartItemId);

            if (idx !== -1) {
              // Nếu đã có thì tăng số lượng
              const currentQuantity = cart[idx].quantity || 1;
              cart[idx] = {
                ...cart[idx],
                quantity: currentQuantity + 1
              };
              await AsyncStorage.setItem('cart', JSON.stringify(cart));
              ToastAndroid.show(
                `Đã tăng số lượng sản phẩm trong giỏ hàng thành ${currentQuantity + 1}`,
                ToastAndroid.SHORT
              );
            } else {
              // Nếu chưa có thì thêm mới với đơn vị tính đã chọn
              const cartItem = {
                id: cartItemId, // Sử dụng ID duy nhất đã tạo ở trên
                masanpham: item.masanpham,
                tensanpham: item.tensanpham,
                anhsanpham: [{ url: mainImage }],
                chitietdonvi: [{
                  dinhluong: selectedUnit.dinhluong,
                  giaban: selectedUnit.giabanSauKhuyenMai || selectedUnit.giaban,
                  donvitinh: { donvitinh: selectedUnit.donvitinh.donvitinh }
                }],
                dinhluong: selectedUnit.dinhluong,
                quantity: 1,
                thuockedon: item.thuockedon,
                khuyenmai: item.khuyenmai
              };
              cart.push(cartItem);
              await AsyncStorage.setItem('cart', JSON.stringify(cart));
              ToastAndroid.show(
                'Đã thêm vào giỏ hàng!',
                ToastAndroid.SHORT
              );
            }
          } catch (error) {
            console.error(error);
            ToastAndroid.show(
              'Có lỗi xảy ra khi thêm vào giỏ hàng',
              ToastAndroid.SHORT
            );
          }
        }}>
          <Text style={styles.buyButtonText}>
            {item.thuockedon ? 'Tư vấn ngay' : 'Chọn mua'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0078D4" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f7f8fa' }}>
      <Text style={styles.header}>{'Danh sách thuốc của ' + tendanhmuc || 'Danh sách sản phẩm'}</Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 16 }}>
        <Image
          source={require('../assets/images/home.jpg')}
          style={{ width: 22, height: 22, marginRight: 6 }}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => require('expo-router').useRouter().replace('/')}>
          <Text style={{ color: '#0078D4', fontWeight: 'bold', fontSize: 15 }}>Trang chủ</Text>
        </TouchableOpacity>
        <Text style={{ color: '#888', fontSize: 15, marginHorizontal: 6 }}>/</Text>
        <Text style={{ color: '#003366', fontWeight: 'bold', fontSize: 15 }}>Danh sách thuốc</Text>
      </View>
      {/* Nút sắp xếp */}
      <View style={{ flexDirection: 'row', alignItems: 'center',marginTop: 15 ,marginLeft: 16, marginBottom: 8 }}>
        <Text style={{ fontSize: 15, marginRight: 8 }}>Sắp xếp theo giá:</Text>
        <TouchableOpacity
          style={{
            backgroundColor: sortOrder === 'asc' ? '#0078D4' : '#f2f2f2',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginRight: 8,
          }}
          onPress={() => setSortOrder('asc')}
        >
          <Text style={{ color: sortOrder === 'asc' ? '#fff' : '#0078D4', fontWeight: 'bold' }}>Tăng dần</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: sortOrder === 'desc' ? '#0078D4' : '#f2f2f2',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
          onPress={() => setSortOrder('desc')}
        >
          <Text style={{ color: sortOrder === 'desc' ? '#fff' : '#0078D4', fontWeight: 'bold' }}>Giảm dần</Text>
        </TouchableOpacity>
      </View>
      {/* ...breadcrumb... */}
      
      <FlatList
        data={sortedProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard item={item} />}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>Không có sản phẩm nào</Text>}
      />
      
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 16,
    marginTop: 80,
    color: '#003366',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: CARD_WIDTH,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
    marginTop: 20
  },
  discountTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 90,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0078D4',
  },
  oldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  unit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  buyButton: {
    backgroundColor: '#0078D4',
    borderRadius: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
});
