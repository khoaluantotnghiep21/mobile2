import CategorySection from '@/components/CategorySection';
import Footer from '@/components/Footer';
import SideDrawer from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FeaturedProducts from '../../components/FeaturedProducts';

interface Product {
  id: string;
  tensanpham: string;
  anhsanpham: Array<{
    url: string;
    ismain: boolean | null;
  }>;
  chitietdonvi: Array<{
    giaban: number;
    donvitinh: {
      donvitinh: string;
    };
  }>;
}

// Define the extended Product interface for promotional products
interface PromotionalProduct extends Product {
  masanpham: string;
  khuyenmai?: {
    tenchuongtrinh: string;
    giatrikhuyenmai?: number;
  };
  chitietdonvi: Array<{
    giaban: number;
    giabanSauKhuyenMai?: number;
    donvitinh: {
      donvitinh: string;
    };
  }>;
}

const { width } = Dimensions.get('window');

const bannerData = [
  require('../../assets/images/banner1.webp'),
  require('../../assets/images/banner2.webp'),
  require('../../assets/images/banner3.webp'),
  require('../../assets/images/banner4.webp'),
];

export default function HomeScreen() {
  const flatListRef = useRef<FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      setShowResults(true);

      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounce
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Searching for:', searchQuery);
          // Thêm catch cho fetch để xử lý lỗi mạng
          const response = await fetch(
            `https://be-ecom-longchau-production-hehe.up.railway.app/product/search?query=${encodeURIComponent(searchQuery)}`
          ).catch((error) => {
            console.log('Lỗi kết nối API search:', error);
            throw error;
          });

          const responseData = await response.json();
          console.log('Search response:', responseData);

          // Trích xuất mảng sản phẩm từ cấu trúc response
          if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
            setSearchResults(responseData.data.data);
          } else {
            console.log('Unexpected data format:', responseData);
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500); // 500ms debounce
    } else {
      setShowResults(false);
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
    setCurrentIndex(index);
  };

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {bannerData.map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => scrollToIndex(index)}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            {/* Menu icon bên trái */}
            <TouchableOpacity onPress={() => setDrawerVisible(true)}>
              <Image source={require('../../assets/images/menu.webp')} style={styles.menuIcon} />
            </TouchableOpacity>
            {/* Logo ở giữa */}
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Image source={require('../../assets/images/logo.webp')} style={styles.logo} />
            </TouchableOpacity>
            {/* Bell hoặc các thành phần khác bên phải */}
            <Image source={require('../../assets/images/bell.png')} style={styles.bell} />
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Tìm kiếm thuốc..."
              style={styles.searchInput}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {showResults && (
              <View style={styles.searchResults}>
                {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#0078D4" />
                  </View>
                ) : searchResults.length > 0 ? (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    style={{ maxHeight: 300 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => {
                          router.push(`/product-detail?id=${item.id}`);
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                      >
                        <Image
                          source={{
                            uri: item.anhsanpham.find((img) => img.ismain)?.url || item.anhsanpham[0]?.url,
                          }}
                          style={styles.searchResultImage}
                        />
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultTitle} numberOfLines={2}>
                            {item.tensanpham}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                ) : searchQuery.trim() !== '' ? (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>Không tìm thấy kết quả</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </View>

        {/* Main content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View>
            <FlatList
              ref={flatListRef}
              data={bannerData}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Image source={item} style={styles.banner} />
              )}
              keyExtractor={(_, index) => index.toString()}            />
            {renderPagination()}
            <CategorySection />
            
            {/* Featured Products Section */}
            <FeaturedProducts />
           
          </View>
          
          {/* Footer */}
          <Footer />
          
        </ScrollView>
      </View>

      {/* SideDrawer */}
      <SideDrawer isVisible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: 'relative',
    zIndex: 1,
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  searchResultTitle: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 14,
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
  banner: {
    width: width,
    height: 180,
    resizeMode: 'cover',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#ccc',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#0078D4',
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  promotionalProductCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    width: 160,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
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
  promotionalProductImage: {
    width: '100%',
    height: 100,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  promotionalProductInfo: {
    flexGrow: 1,
  },
  promotionalProductTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
    height: 40, // Limit to 2 lines
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  promotionalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0078D4',
  },
  unitText: {
    fontSize: 12,
    color: '#666',
  },
});