import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Category {
  madanhmuc?: string; // chỉ có ở subCategory
  tenloai: string; // tên loại chính
  maloai: string;
  soluong?: number;
}

interface SubCategory {
  madanhmuc: string;
  tendanhmuc: string;
  soluong: number;
  maloai: string;
  // slug?: string; // Không cần dùng slug trong mobile
}

interface SideDrawerProps {
  onClose: () => void;
  isVisible: boolean;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ onClose, isVisible }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width)); // Animation state
  const [userPhone, setUserPhone] = useState<string | null>(null);

  // Lấy user mỗi khi SideDrawer được focus (mở ra)
  useFocusEffect(
    React.useCallback(() => {
      const fetchUser = async () => {
        try {
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setUserPhone(user.numberPhone ?? user.sodienthoai ?? user.phoneNumber ?? null);
          } else {
            setUserPhone(null);
          }
        } catch {
          setUserPhone(null);
        }
      };
      if (isVisible) fetchUser();
    }, [isVisible])
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('https://be-ecom-longchau-production-hehe.up.railway.app/loai/getLoai');
        const json = await res.json();
        setCategories(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error('Lỗi API:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleCategoryPress = async (maloai: string) => {
    if (expandedCategory === maloai) {
      setExpandedCategory(null); // Collapse category
      setSubCategories([]);
      return;
    }
    setExpandedCategory(maloai); // Expand category
    setLoadingSubCategories(true);
    try {
      const res = await fetch(
        `https://be-ecom-longchau-production-hehe.up.railway.app/category/getDanhMucByLoai/${maloai}`
      );
      const json = await res.json();
      setSubCategories(json.data ?? []);
    } catch (error) {
      console.error('Lỗi API danh mục con:', error);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const handleLoginPress = () => {
    onClose(); // Đóng SideDrawer
    router.push('/login'); // Điều hướng sang màn hình Login
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('userPhone'); 
    setUserPhone(null);
    onClose();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Nhà Thuốc Long Châu</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={30} color="#333" />
          </TouchableOpacity>
        </View>

        {userPhone ? (
          <View style={styles.user}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <MaterialIcons name="account-circle" size={36} color="#fff" style={{marginRight: 8}} />
              <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16, flex: 1}} onPress={() => {
                onClose();
                router.push('/account');
              }}>{userPhone}</Text>
              <TouchableOpacity style={[styles.authButton, {backgroundColor: '#004C99', width: 120,marginRight: 0}]} onPress={handleLogout}>
                <Text style={{color: '#fff', fontWeight: 'bold', textAlign: 'center'}}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.user}>
            <Text style={styles.userText}>
              Đăng nhập để hưởng quyền lợi riêng dành cho thành viên
            </Text>
            <View style={styles.authButtons}>
              <TouchableOpacity style={styles.authButton} onPress={handleLoginPress}>
                <Text style={styles.authButtonText}>Đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.authButtonSignUp} onPress={() => {
                onClose();
                router.push('/register');
              }}>
                <Text style={styles.authButtonTextSignUp}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Categories */}
        {categories.map((category) => (
          <View key={category.maloai}>
            <TouchableOpacity
              style={styles.category}
              onPress={() => handleCategoryPress(category.maloai)}
            >
              <Text style={styles.categoryText}>{category.tenloai}</Text>
              <MaterialIcons
                name={
                  expandedCategory === category.maloai
                    ? 'expand-less'
                    : 'expand-more'
                }
                size={24}
                color="#333"
              />
            </TouchableOpacity>
            {expandedCategory === category.maloai && (
              <View style={styles.subMenu}>
                {loadingSubCategories ? (
                  <ActivityIndicator size="small" color="#0066CC" />
                ) : (
                  subCategories.map((subCategory) => (
                    <TouchableOpacity
                      key={subCategory.madanhmuc}
                      style={styles.subMenuItem}
                      onPress={() => {
                        onClose();
                        router.push({
                          pathname: '/product-list',
                          params: {
                            madanhmuc: subCategory.madanhmuc,
                            tendanhmuc: subCategory.tendanhmuc,
                          },
                        });
                      }}
                    >
                      <Text style={styles.subMenuText}>
                        {subCategory.tendanhmuc}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.8, // Drawer occupies 80% of the screen width
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingTop: 50,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  category: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  subMenu: {
    paddingLeft: 20,
    paddingBottom: 10,
    backgroundColor: '#F9F9F9',
  },
  subMenuItem: {
    paddingVertical: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  subMenuText: {
    fontSize: 14,
    color: '#666',
  },

  user: {
    backgroundColor: '#0066CC',
    padding: 15,
  },
  userText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    width: 120,
  },
  authButtonText: {
    color: '#0066CC',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  authButtonSignUp: {
    backgroundColor: '#004C99',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    width: 120,
  },
  authButtonTextSignUp: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SideDrawer;