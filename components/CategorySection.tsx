import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; 

interface Category {
  madanhmuc: string;
  tendanhmuc: string;
  soluong: number;
}

export default function CategorySection() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('https://be-ecom-longchau-production-hehe.up.railway.app/category/getAllCategories');
        const json = await res.json();
        let data = json?.data;
        if (Array.isArray(data)) {
          // Map về đúng interface Category và sort theo soluong giảm dần, lấy 12 danh mục đầu tiên
          const sorted = data
            .map((cat: any) => ({
              madanhmuc: cat.madanhmuc ?? '',
              tendanhmuc: cat.tendanhmuc ?? '',
              soluong: typeof cat.soluong === 'number' ? cat.soluong : 0,
            }))
            .sort((a, b) => b.soluong - a.soluong)
            .slice(0, 12);
          setCategories(sorted);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/product-list',
      params: {
        madanhmuc: category.madanhmuc,
        tendanhmuc: category.tendanhmuc,
      },
    });
  };

  const renderItem = ({ item }: { item: Category }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.title} numberOfLines={2}>
          {item.tendanhmuc || 'Không có tên'}
        </Text>
        <Text style={styles.count}>
          {typeof item.soluong === 'number' ? `${item.soluong} sản phẩm` : 'Không rõ số lượng'}
        </Text>
      </TouchableOpacity>
    );
  };

  // Hiển thị 6 danh mục đầu tiên, hoặc tất cả nếu showAll
  const safeCategories = Array.isArray(categories) ? categories : [];
  const visibleCategories = showAll ? safeCategories : safeCategories.slice(0, 6);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0078D4" />
      </View>
    );
  }

  if (!loading && safeCategories.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Danh mục nổi bật</Text>
        <Text style={{ textAlign: 'center', color: '#888', marginVertical: 24 }}>
          Không có danh mục nào để hiển thị.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏆 Danh mục nổi bật</Text>
      
      <FlatList
        data={visibleCategories}
        keyExtractor={(item) => item.madanhmuc}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

      {/* Nút "Xem thêm" chỉ hiện nếu có hơn 6 danh mục */}
      {!showAll && categories.length > 6 && (
        <TouchableOpacity 
          style={styles.seeMoreButton} 
          onPress={() => setShowAll(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.seeMoreText}>
            ⌄ Xem thêm {categories.length - 6} danh mục
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#003366',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    width: ITEM_WIDTH,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#003366',
    marginBottom: 4,
    height: 40, // Giới hạn chiều cao cho 2 dòng
  },
  count: {
    fontSize: 12,
    color: '#666',
  },
  seeMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#0078D4',
    fontWeight: '500',
  },
});