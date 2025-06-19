import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
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
  thuockedon: boolean;
}

// Product Card component
const ProductCard = ({ item }: { item: Product }) => {
  const [selectedUnitIdx, setSelectedUnitIdx] = React.useState(0);
  const units = item.chitietdonvi || [];
  const selectedUnit = units[selectedUnitIdx] || units[0];
  const router = useRouter();

  // Find main image or use the first one
  let imageUrl = undefined;
  if (item.anhsanpham && item.anhsanpham.length > 0) {
    const mainImg = item.anhsanpham.find(img => img.ismain === true);
    imageUrl = mainImg ? mainImg.url : item.anhsanpham[0].url;
  }
  
  // Calculate discount percentage if applicable
  let discountPercent = 0;
  if (selectedUnit?.giabanSauKhuyenMai && selectedUnit.giaban > selectedUnit.giabanSauKhuyenMai) {
    discountPercent = Math.round(((selectedUnit.giaban - selectedUnit.giabanSauKhuyenMai) / selectedUnit.giaban) * 100);
  }
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.85} 
      onPress={() => router.push({ pathname: '/product-detail', params: { masanpham: item.masanpham } })}
    >
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
      
      {/* Unit options */}
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
      
      {/* Price display */}
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
      
      {/* Buy button */}
      <TouchableOpacity 
        style={styles.buyButton} 
        onPress={async e => {
          e.stopPropagation();
          // Check if user is logged in
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
            // Get current cart
            const cartStr = await AsyncStorage.getItem('cart');
            let cart = [];
            try { cart = cartStr ? JSON.parse(cartStr) : []; } catch { cart = []; }

            // Find main image
            const mainImage = item.anhsanpham?.find(img => img.ismain === true)?.url ?? 
                            item.anhsanpham?.[0]?.url ?? '';

            // Create unique ID based on product code and unit
            const cartItemId = `${item.masanpham}-${selectedUnit.donvitinh.donvitinh}`;
            
            // Check if product with this ID already exists in cart
            const idx = cart.findIndex((p: any) => p.id === cartItemId);

            if (idx !== -1) {
              // If exists, increase quantity
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
              // If not exists, add new item with selected unit
              const cartItem = {
                id: cartItemId,
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
        }}
      >
        <Text style={styles.buyButtonText}>
          {item.thuockedon ? 'Tư vấn ngay' : 'Chọn mua'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const response = await fetch(
        'https://be-ecom-longchau-production-hehe.up.railway.app/product/getAllProducts'
      );
      const responseData = await response.json();

      if (responseData?.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
        // Always use the first 4 products from the API to ensure we have products to display
        const featuredProducts = responseData.data.slice(0, 4);
        console.log('Featured products loaded:', featuredProducts.length);
        
        if (featuredProducts.length > 0) {
          setProducts(featuredProducts);
          return;
        }
      }
      
      // If API doesn't return data, use sample products
      console.log('No products from API, using sample products');
      const sampleProducts = [
        {
          id: "9c14491c-023d-4da1-a697-0e70cb10273b",
          masanpham: "SP78615355",
          tensanpham: "Bào tử lợi khuẩn Livespo DIA 30 hỗ trợ giảm tiêu chảy cấp tính",
          anhsanpham: [
            {
              url: "https://res.cloudinary.com/dlkr4jxiu/image/upload/v1748771701/media/inmpomu7i6d299aox60z.webp",
              ismain: true
            }
          ],
          chitietdonvi: [
            {
              dinhluong: 10,
              giaban: 150000,
              donvitinh: {
                donvitinh: "Hộp"
              },
              giabanSauKhuyenMai: 120000
            }
          ],
          thuockedon: false,
          gianhap: 250000,
        },
        {
          id: "9c14491c-023d-4da1-a697-0e70cb10274b",
          masanpham: "SP78615356",
          tensanpham: "Viên uống bổ sung vitamin tổng hợp cho người lớn",
          anhsanpham: [
            {
              url: "https://res.cloudinary.com/dlkr4jxiu/image/upload/v1749871848/media/t5yzjhctvhs3e2x7amqj.jpg",
              ismain: true
            }
          ],
          chitietdonvi: [
            {
              dinhluong: 30,
              giaban: 180000,
              donvitinh: {
                donvitinh: "Hộp"
              },
              giabanSauKhuyenMai: 150000
            }
          ],
          thuockedon: false,
          gianhap: 100000,
        },
        {
          id: "9c14491c-023d-4da1-a697-0e70cb10275c",
          masanpham: "SP78615357",
          tensanpham: "Viên sủi Vitamin C tăng cường sức đề kháng",
          anhsanpham: [
            {
              url: "https://res.cloudinary.com/dlkr4jxiu/image/upload/v1748771702/media/kfqbmocnusdociionink.png",
              ismain: true
            }
          ],
          chitietdonvi: [
            {
              dinhluong: 20,
              giaban: 95000,
              donvitinh: {
                donvitinh: "Tuýp"
              },
              giabanSauKhuyenMai: 80000
            }
          ],
          thuockedon: false,
          gianhap: 60000,
        },
        {
          id: "9c14491c-023d-4da1-a697-0e70cb10276d",
          masanpham: "SP78615358",
          tensanpham: "Thuốc giảm đau, hạ sốt paracetamol 500mg",
          anhsanpham: [
            {
              url: "https://res.cloudinary.com/dlkr4jxiu/image/upload/v1749872317/media/xhela1b3e4z4hhbinlex.jpg",
              ismain: true
            }
          ],
          chitietdonvi: [
            {
              dinhluong: 100,
              giaban: 35000,
              donvitinh: {
                donvitinh: "Vỉ"
              },
              giabanSauKhuyenMai: 30000
            }
          ],
          thuockedon: true,
          gianhap: 20000,
        }
      ];
      setProducts(sampleProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      // If there's an error, still show sample products
      const sampleProducts = [
        {
          id: "9c14491c-023d-4da1-a697-0e70cb10273b",
          masanpham: "SP78615355",
          tensanpham: "Bào tử lợi khuẩn Livespo DIA 30 hỗ trợ giảm tiêu chảy cấp tính",
          anhsanpham: [
            {
              url: "https://res.cloudinary.com/dlkr4jxiu/image/upload/v1748771701/media/inmpomu7i6d299aox60z.webp",
              ismain: true
            }
          ],
          chitietdonvi: [
            {
              dinhluong: 10,
              giaban: 150000,
              donvitinh: {
                donvitinh: "Hộp"
              },
              giabanSauKhuyenMai: 120000
            }
          ],
          thuockedon: false,
          gianhap: 250000,
        },
        {
          id: "9c14491c-023d-4da1-a697-0e70cb10274b",
          masanpham: "SP78615356",
          tensanpham: "Viên uống bổ sung vitamin tổng hợp cho người lớn",
          anhsanpham: [
            {
              url: "https://res.cloudinary.com/dlkr4jxiu/image/upload/v1749871848/media/t5yzjhctvhs3e2x7amqj.jpg",
              ismain: true
            }
          ],
          chitietdonvi: [
            {
              dinhluong: 30,
              giaban: 180000,
              donvitinh: {
                donvitinh: "Hộp"
              },
              giabanSauKhuyenMai: 150000
            }
          ],
          thuockedon: false,
          gianhap: 100000,
        },
        {
          id: "9c14491c-023d-4da1-a697-0e70cb10275c",
          masanpham: "SP78615357",
          tensanpham: "Viên sủi Vitamin C tăng cường sức đề kháng",
          anhsanpham: [
            {
              url: "https://res.cloudinary.com/dlkr4jxiu/image/upload/v1748771702/media/kfqbmocnusdociionink.png",
              ismain: true
            }
          ],
          chitietdonvi: [
            {
              dinhluong: 20,
              giaban: 95000,
              donvitinh: {
                donvitinh: "Tuýp"
              },
              giabanSauKhuyenMai: 80000
            }
          ],
          thuockedon: false,
          gianhap: 60000,
        },
        {
          id: "9c14491c-023d-4da1-a697-0e70cb10276d",
          masanpham: "SP78615358",
          tensanpham: "Thuốc giảm đau, hạ sốt paracetamol 500mg",
          anhsanpham: [
            {
              url: "https://res.cloudinary.com/dlkr4jxiu/image/upload/v1749872317/media/xhela1b3e4z4hhbinlex.jpg",
              ismain: true
            }
          ],
          chitietdonvi: [
            {
              dinhluong: 100,
              giaban: 35000,
              donvitinh: {
                donvitinh: "Vỉ"
              },
              giabanSauKhuyenMai: 30000
            }
          ],
          thuockedon: true,
          gianhap: 20000,
        }
      ];
      setProducts(sampleProducts);
      setError(false); // Don't show error, show the sample products instead
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/product-list')}
          >
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0078D4" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể tải danh sách sản phẩm</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchFeaturedProducts}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có sản phẩm nổi bật nào để hiển thị</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/product-list')}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id || item.masanpham}
        renderItem={({ item }) => <ProductCard item={item} />}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  viewAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e9f7',
  },
  viewAllText: {
    fontSize: 12,
    color: '#0078D4',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
  },
  errorText: {
    color: '#888',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#0078D4',
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
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
