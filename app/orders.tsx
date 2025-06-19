import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface OrderProduct {
  tensanpham: string;
  donvitinh: string;
  soluong: number;
  giaban: number;
  url: string;
}

interface Order {
  madonhang: string;
  hoten: string;
  thanhtien: number;
  trangthai: string;
  sanpham: OrderProduct[];
  ngaytao?: string; // Old field, keeping for backward compatibility
  ngaymuahang: string; // Added purchase date field
}

const OrderStatusColor: Record<string, string> = {
  'Đang chờ xác nhận': '#FF9500',
  'Đang giao hàng': '#007AFF',
  'Đã xác nhận': '#4CD964',
  'Đã hủy': '#FF3B30',
};

// List of all possible order statuses for filtering
const ORDER_STATUSES = [
  'Tất cả',
  'Đang chờ xác nhận',
  'Đang giao hàng',
  'Đã xác nhận',
  'Đã hủy'
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  // Apply filters and sorting whenever orders, selectedStatus, or sortOrder changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, selectedStatus, sortOrder]);

  const applyFiltersAndSort = () => {
    let result = [...orders];

    // Apply status filter
    if (selectedStatus !== 'Tất cả') {
      result = result.filter(order => order.trangthai === selectedStatus);
    }

    // Apply sorting based on purchase date
    result.sort((a, b) => {
      const dateA = a.ngaymuahang ? new Date(a.ngaymuahang) : new Date(0);
      const dateB = b.ngaymuahang ? new Date(b.ngaymuahang) : new Date(0);

      if (sortOrder === 'newest') {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });

    setFilteredOrders(result);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Kiểm tra accessToken trước
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('No access token found');
        router.replace('/login');
        return;
      }

      const userStr = await AsyncStorage.getItem('user');

      if (!userStr || !accessToken) {
        router.replace('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user.sub;

      if (!userId) {
        console.error('User data:', user);
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      const res = await fetch(
        `https://be-ecom-longchau-production-hehe.up.railway.app/purchase-order/getOderByUserId/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message ?? 'Không thể tải danh sách đơn hàng'
        );
      }

      const data = await res.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Dữ liệu không hợp lệ');
      }

      // Kiểm tra và xử lý dữ liệu đơn hàng
      interface RawOrderProduct {
        tensanpham?: string;
        donvitinh?: string;
        soluong?: number;
        giaban?: number;
        url?: string;
      }

      interface RawOrder {
        madonhang?: string;
        hoten?: string;
        thanhtien?: number;
        trangthai?: string;
        sanpham?: RawOrderProduct[];
        ngaytao?: string;
        ngaymuahang?: string; // Added purchase date field
      }

      const orders: Order[] = Array.isArray(data.data)
        ? data.data.map((order: RawOrder): Order => ({
          madonhang: order.madonhang?.toString() ?? 'Unknown',
          hoten: order.hoten?.toString() ?? '',
          thanhtien: typeof order.thanhtien === 'number' ? order.thanhtien : 0,
          trangthai: order.trangthai?.toString() ?? 'Không xác định',
          ngaymuahang: order.ngaymuahang ?? new Date().toISOString().split('T')[0],
          ngaytao: order.ngaytao ?? new Date().toISOString(), // Keep for backward compatibility
          sanpham: Array.isArray(order.sanpham)
            ? order.sanpham.map((product: RawOrderProduct): OrderProduct => ({
              tensanpham: product.tensanpham ?? '',
              donvitinh: product.donvitinh ?? '',
              soluong: typeof product.soluong === 'number' ? product.soluong : 0,
              giaban: typeof product.giaban === 'number' ? product.giaban : 0,
              url: product.url ?? '',
            }))
            : [],
        }))
        : [];

      // Sort by default to newest first
      orders.sort((a, b) => {
        const dateA = a.ngaytao ? new Date(a.ngaytao) : new Date(0);
        const dateB = b.ngaytao ? new Date(b.ngaytao) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderOrderItem = (order: Order, index: number) => (
    <View key={`order-${order.madonhang}-${index}`} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>
            <Text>Đơn hàng: </Text>
            <Text>{order.madonhang}</Text>
          </Text>
          <Text style={styles.orderDate}>
            <Text>Ngày mua: </Text>
            <Text>{formatDate(order.ngaymuahang)}</Text>
          </Text>
        </View>
        <Text style={[styles.orderStatus, { color: OrderStatusColor[order.trangthai] || '#333' }]}>
          {order.trangthai}
        </Text>
      </View>

      {order.sanpham.map((product, productIndex) => (
        <View
          key={`product-${order.madonhang}-${productIndex}`}
          style={[
            styles.productContainer,
            productIndex === order.sanpham.length - 1 && styles.lastProduct
          ]}
        >
          <Image
            source={{ uri: product.url }}
            style={styles.productImage}
            defaultSource={require('../assets/images/danhmuc.webp')}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.tensanpham}
            </Text>
            <Text style={styles.productUnit}>
              {product.donvitinh} x {product.soluong}
            </Text>
            <Text style={styles.productPrice}>
              {product.giaban.toLocaleString()}đ
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.orderFooter}>
        <Text style={styles.totalText}>
          Thành tiền
        </Text>
        <Text style={styles.totalAmount}>
          {order.thanhtien.toLocaleString()}đ
        </Text>
      </View>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lọc đơn hàng</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOrder === 'newest' && styles.filterOptionSelected
                ]}
                onPress={() => setSortOrder('newest')}
              >
                <Text style={sortOrder === 'newest' ? styles.filterOptionTextSelected : styles.filterOptionText}>
                  Mới nhất
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOrder === 'oldest' && styles.filterOptionSelected
                ]}
                onPress={() => setSortOrder('oldest')}
              >
                <Text style={sortOrder === 'oldest' ? styles.filterOptionTextSelected : styles.filterOptionText}>
                  Cũ nhất
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Trạng thái đơn hàng</Text>
            <View style={styles.statusOptions}>
              {ORDER_STATUSES.map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedStatus === status && styles.statusOptionSelected
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text
                    style={
                      selectedStatus === status
                        ? styles.statusOptionTextSelected
                        : styles.statusOptionText
                    }
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              applyFiltersAndSort();
              setShowFilterModal(false);
            }}
          >
            <Text style={styles.applyButtonText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0078D4" />
          <Text style={styles.emptyText}>
            Đang tải...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <View style={styles.centerContent}>
          <MaterialIcons name="shopping-bag" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {selectedStatus !== 'Tất cả'
              ? `Không có đơn hàng nào với trạng thái "${selectedStatus}"`
              : 'Chưa có đơn hàng nào'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content}>
        {filteredOrders.map(renderOrderItem)}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Đơn hàng của tôi
        </Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter chips row */}
      <View style={styles.filterChipsContainer}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {ORDER_STATUSES.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipSelected
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === status && styles.filterChipTextSelected
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderContent()}
      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    backgroundColor: '#0078D4',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastProduct: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#0078D4',
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 15,
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0078D4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    marginRight: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#0078D4',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  filterOptionTextSelected: {
    fontSize: 14,
    color: '#fff',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusOption: {
    flexBasis: '48%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusOptionSelected: {
    backgroundColor: '#0078D4',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#333',
  },
  statusOptionTextSelected: {
    fontSize: 14,
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#0078D4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#0078D4',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
  },
  filterChipTextSelected: {
    fontSize: 14,
    color: '#fff',
  },
  filterButton: {
    padding: 4,
  },
});