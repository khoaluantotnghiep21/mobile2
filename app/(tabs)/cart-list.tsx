import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CartProduct {
  id: string;
  masanpham: string;
  tensanpham: string;
  anhsanpham: { url: string }[];
  chitietdonvi: {
    dinhluong: number;
    giaban: number;
    donvitinh: { donvitinh: string };
  }[];
  quantity?: number;
}

export default function CartListScreen() {
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const loadCart = async () => {
      const data = await AsyncStorage.getItem('cart');
      if (data) setCart(JSON.parse(data));
    };
    const unsubscribe = setInterval(loadCart, 500); // auto update when add
    return () => clearInterval(unsubscribe);
  }, []);

  // Chọn tất cả
  const allSelected = cart.length > 0 && selectedIds.length === cart.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(cart.map(item => item.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const total = cart
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + ((item.chitietdonvi?.[0]?.giaban || 0) * (item.quantity || 1)), 0);

  const renderRadio = (checked: boolean) => (
    <View style={[styles.radioOuter, checked && { borderColor: '#0078D4' }]}>
      {checked ? <View style={styles.radioInner} /> : null}
    </View>
  );

  const renderItem = ({ item }: { item: CartProduct }) => (
    <View style={styles.item}>
      <Pressable onPress={() => toggleSelect(item.id)}>
        {renderRadio(selectedIds.includes(item.id))}
      </Pressable>
      <Image source={item.anhsanpham?.[0]?.url ? { uri: item.anhsanpham[0].url } : require('../../assets/images/danhmuc.webp')} style={styles.itemImage} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemName} numberOfLines={2}>{item.tensanpham}</Text>
        <Text style={styles.itemPrice}>
          {item.chitietdonvi?.[0]?.giaban?.toLocaleString() || 'Không rõ'}đ 
          <Text style={{color:'#888'}}> x{item.quantity || 1} {item.chitietdonvi?.[0]?.donvitinh?.donvitinh || ''}</Text>
        </Text>
      </View>
      {/* Xóa sản phẩm */}
      <TouchableOpacity onPress={async () => {
        const newCart = cart.filter(p => p.id !== item.id);
        setCart(newCart);
        setSelectedIds(ids => ids.filter(i => i !== item.id));
        await AsyncStorage.setItem('cart', JSON.stringify(newCart));
      }}>
        <Text style={{color:'#FF3B30',fontWeight:'bold',fontSize:18,marginLeft:8}}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Giỏ hàng */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
      </View>
      {/* Chọn tất cả */}
      <View style={styles.selectAllRow}>
        <Pressable onPress={toggleSelectAll}>
          {renderRadio(allSelected)}
        </Pressable>
        <Text style={styles.selectAllText}>
          Chọn tất cả ({cart.length})
        </Text>
      </View>
      {cart.length === 0 ? (
        <Text style={styles.empty}>Chưa có sản phẩm nào trong giỏ hàng.</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={{color:'#0078D4',fontWeight:'bold'}}>Áp dụng ưu đãi để được giảm giá</Text>
            <Text style={{color:'#888'}}>›</Text>
          </TouchableOpacity>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Thành tiền</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()}đ</Text>
          </View>
          <TouchableOpacity
            style={[styles.buyBtn, { opacity: selectedIds.length === 0 ? 0.5 : 1 }]}
            disabled={selectedIds.length === 0}
            onPress={() => require('expo-router').useRouter().push('/cart')}
          >
            <Text style={styles.buyBtnText}>Mua hàng</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    
  },
  headerContainer: {
    height: 80,
    marginTop: 60,
    backgroundColor: '#0078D4',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectAllText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#003366',
    fontWeight: 'bold',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0078D4',
  },
  empty: {
    fontSize: 16,
    color: '#888',
    alignSelf: 'center',
    marginTop: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    marginHorizontal: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#0078D4',
    fontWeight: 'bold',
  },
  promoBtn: {
    margin:16,marginTop:0,backgroundColor:'#f2f6fa',borderRadius:12,padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'
  },
  totalRow: {
    flexDirection:'row',alignItems:'center',justifyContent:'space-between',margin:16,marginTop:0
  },
  totalLabel: {
    fontWeight:'bold',fontSize:18,color:'#003366'
  },
  totalValue: {
    fontWeight:'bold',fontSize:18,color:'#0078D4'
  },
  buyBtn: {
    backgroundColor:'#0078D4',marginHorizontal:16,borderRadius:20,paddingVertical:14,marginBottom:24
  },
  buyBtnText: {
    color:'#fff',fontWeight:'bold',textAlign:'center',fontSize:17
  }
});
