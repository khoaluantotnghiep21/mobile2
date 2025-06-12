import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { TextInput } from 'react-native-gesture-handler';
import SideDrawer from '../components/SideDrawer';
import Footer from '@/components/Footer';

const { width } = Dimensions.get('window');

interface ProductDetail {
  id: string;
  masanpham: string;
  tensanpham: string;
  slug: string;
  dangbaoche: string;
  congdung: string;
  chidinh: string;
  chongchidinh: string;
  thuockedon: boolean;
  motangan: string;
  doituongsudung: string;
  luuy: string;
  ngaysanxuat: string;
  hansudung: number;
  gianhap: number;
  danhmuc: { tendanhmuc: string };
  thuonghieu: { tenthuonghieu: string };
  khuyenmai?: { tenchuongtrinh: string };
  anhsanpham: { url: string; ismain?: boolean | null }[];
  chitietdonvi: {
    dinhluong: number;
    giaban: number;
    donvitinh: { donvitinh: string };
  }[];
  chitietthanhphan: {
    hamluong: string;
    thanhphan: { tenthanhphan: string };
  }[];
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { masanpham } = useLocalSearchParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false); // Thêm state drawer

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`https://be-ecom-longchau-production-hehe.up.railway.app/product/findProduct/${masanpham}`);
        setProduct((await res.json()).data ?? null);
      } catch (error) {
        console.error(error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [masanpham]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0078D4" />
      </View>
    );
  }
  if (!product) {
    return (
      <Text style={{ textAlign: 'center', marginTop: 40, color: 'red' }}>
        Không tìm thấy sản phẩm
        {typeof masanpham === 'string' ? ` (Mã: ${masanpham})` : ''}
      </Text>
    );
  }

  // Ảnh đại diện và carousel
  const images = product.anhsanpham || [];
  const mainImg = images.find(img => img.ismain === true) || images[0];

  // Đơn vị tính
  const units = product.chitietdonvi || [];
  const selectedUnit = units[selectedUnitIdx] || units[0];

  // Hàm thêm sản phẩm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!product || !selectedUnit) return;
    // Kiểm tra đăng nhập trước khi thêm vào giỏ hàng
    const userPhone = await AsyncStorage.getItem('userPhone');
    if (!userPhone) {
      // Nếu chưa đăng nhập thì alert
      alert('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng');
      return;
    }
    try {
      const cartRaw = await AsyncStorage.getItem('cart');
      let cart = [];
      if (cartRaw) {
        cart = JSON.parse(cartRaw);
      }
      // Tạo ID duy nhất dựa trên mã sản phẩm và đơn vị tính
      const cartItemId = `${product.masanpham}-${selectedUnit.donvitinh.donvitinh}`;
            
      // Kiểm tra đã có sản phẩm với ID này trong giỏ chưa
      const idx = cart.findIndex((p: any) => p.id === cartItemId);

      if (idx !== -1) {
        const currentQuantity = cart[idx].quantity || 1;
        cart[idx] = {
          ...cart[idx],
          quantity: currentQuantity + 1
        };
        await AsyncStorage.setItem('cart', JSON.stringify(cart));
        ToastAndroid.show(`Đã tăng số lượng sản phẩm trong giỏ hàng thành ${currentQuantity + 1}`, ToastAndroid.SHORT);
      } else {
        // Tạo object mới cho cart item, không lấy nguyên product
        const mainImage = product.anhsanpham?.find(img => img.ismain === true)?.url || 
                         product.anhsanpham?.[0]?.url || '';

        // Đơn vị tính đã chọn
        const selectedDonvi = {
          dinhluong: selectedUnit.dinhluong,
          giaban: selectedUnit.giaban,
          donvitinh: { donvitinh: selectedUnit.donvitinh.donvitinh }
        };

        // Object để lưu vào giỏ hàng
        const cartItem = {
          id: cartItemId,  // Sử dụng ID duy nhất đã tạo ở trên
          masanpham: product.masanpham,
          tensanpham: product.tensanpham,
          anhsanpham: [{ url: mainImage }],
          chitietdonvi: [selectedDonvi],
          dinhluong: selectedUnit.dinhluong,
          quantity: 1,
          thuockedon: product.thuockedon,
          gianhap: product.gianhap,
          khuyenmai: product.khuyenmai
        };
        
        cart.push(cartItem);
        await AsyncStorage.setItem('cart', JSON.stringify(cart));
        ToastAndroid.show('Đã thêm vào giỏ hàng!', ToastAndroid.SHORT);
      }
    } catch (e) {
      ToastAndroid.show('Có lỗi khi thêm vào giỏ hàng!', ToastAndroid.SHORT);
    }
  };

  return (
    <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.headerTop}>
                {/* Menu icon bên trái */}
                <TouchableOpacity onPress={() => setDrawerVisible(true)}>
                  <Image source={require('../assets/images/menu.webp')} style={styles.menuIcon} />
                </TouchableOpacity>
                {/* Logo ở giữa */}
                <TouchableOpacity onPress={() => router.replace('/') }>
                  <Image source={require('../assets/images/logo.webp')} style={styles.logo} />
                </TouchableOpacity>
                {/* Bell hoặc các thành phần khác bên phải */}
                <Image source={require('../assets/images/bell.png')} style={styles.bell} />
              </View>
              <TextInput
                placeholder="Số 1 thuốc kê đơn bệnh viện"
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imageCarousel}>
          <FlatList
            data={images}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={styles.carouselImage}
                resizeMode="contain"
              />
            )}
            style={{ maxHeight: 180 }}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{product.tensanpham}</Text>
          <Text style={styles.brand}>{product.thuonghieu?.tenthuonghieu || ''}</Text>
          <Text style={styles.category}>{product.danhmuc?.tendanhmuc || ''}</Text>
          {/* Đơn vị tính dạng tab */}
          {units.length > 0 ? (
            <View style={{ flexDirection: 'row', marginVertical: 8 }}>
              {units.map((unit, idx) => (
                <TouchableOpacity
                  key={unit.donvitinh.donvitinh}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: idx === selectedUnitIdx ? '#0078D4' : '#f2f2f2',
                    marginRight: 8,
                  }}
                  onPress={() => setSelectedUnitIdx(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: idx === selectedUnitIdx ? '#fff' : '#333', fontWeight: 'bold', fontSize: 15 }}>
                    {unit.donvitinh.donvitinh}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 14, color: '#888', marginVertical: 8 }}>Đơn vị tính: Không rõ</Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{selectedUnit ? selectedUnit.giaban.toLocaleString() + 'đ' : 'Không rõ'}</Text>
            <Text style={styles.unit}>/ {selectedUnit ? selectedUnit.donvitinh.donvitinh : 'Không rõ'}</Text>
          </View>
          
          {/* Thông tin mô tả */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.sectionText}>{product.motangan}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Công dụng</Text>
            <Text style={styles.sectionText}>{product.congdung}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chỉ định</Text>
            <Text style={styles.sectionText}>{product.chidinh}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chống chỉ định</Text>
            <Text style={styles.sectionText}>{product.chongchidinh}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thành phần</Text>
            {product.chitietthanhphan && product.chitietthanhphan.length > 0 ? (
              product.chitietthanhphan.map((tp, idx) => (
                <Text key={idx} style={styles.sectionText}>
                  {tp.thanhphan.tenthanhphan} {tp.hamluong}
                </Text>
              ))
            ) : (
              <Text style={styles.sectionText}>Không rõ</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đối tượng sử dụng</Text>
            <Text style={styles.sectionText}>{product.doituongsudung}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lưu ý</Text>
            <Text style={styles.sectionText}>{product.luuy}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dạng bào chế</Text>
            <Text style={styles.sectionText}>{product.dangbaoche}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ngày sản xuất</Text>
            <Text style={styles.sectionText}>{product.ngaysanxuat}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hạn sử dụng</Text>
            <Text style={styles.sectionText}>{product.hansudung ? `${product.hansudung} ngày` : 'Không rõ'}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khuyến mãi</Text>
            <Text style={styles.sectionText}>{product.khuyenmai?.tenchuongtrinh || 'Không có'}</Text>
          </View>
          {/* Dòng hiển thị thuốc kê đơn */}
          <Text style={{ fontSize: 15, color: '#0078D4', fontWeight: 'bold', marginBottom: 8 }}>
            Thuốc kê đơn: {product.thuockedon ? 'Có' : 'Không'}
          </Text>
        </View>
        <Footer />
      </ScrollView>
      {/* Thanh button cố định dưới cùng */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', padding: 12, justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: '#f2f2f2', borderRadius: 20, marginRight: 8, paddingVertical: 12 }}>
          <Text style={{ color: '#0078D4', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>Tìm nhà thuốc</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#0078D4', borderRadius: 20, paddingVertical: 12 }}
          onPress={() => {
            if (product.thuockedon) {
              // Có thể xử lý flow tư vấn ở đây nếu cần
            } else {
              handleAddToCart();
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>
            {product.thuockedon ? 'Tư vấn ngay' : 'Chọn mua'}
          </Text>
        </TouchableOpacity>
      </View>
      {/* SideDrawer giống home */}
      <SideDrawer isVisible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    
    </View>
  );
}

const styles = StyleSheet.create({
  imageCarousel: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  carouselImage: {
    width: width * 0.7,
    height: 180,
    borderRadius: 12,
    marginHorizontal: 8,
    backgroundColor: '#f2f2f2',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  brand: {
    fontSize: 15,
    color: '#0078D4',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0078D4',
    marginRight: 8,
  },
  unit: {
    fontSize: 15,
    color: '#666',
  },
  buyButton: {
    backgroundColor: '#0078D4',
    borderRadius: 20,
    paddingVertical: 10,
    marginVertical: 12,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    backgroundColor: '#0078D4',
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  logo: {
    width: 120,
    height: 30,
    resizeMode: 'contain',
  },
  bell: {
    width: 24,
    height: 24,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
  },
});
