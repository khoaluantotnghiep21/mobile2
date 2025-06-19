import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

interface Pharmacy {
  id: string;
  machinhanh: string;
  diachi: string;
}


export enum PaymentMethod {
    CashOnDelivery = 'Thanh toán khi nhận hàng',
    BankTransfer = 'Chuyển khoản ngân hàng',
}

export enum DeliveryMethod {
    HomeDelivery = 'Giao hàng tận nhà',
    PickUpAtPharmacy = 'Nhận hàng tại nhà thuốc',
}


const paymentMethods = [
  { key: 'cod', label: 'Thanh toán tiền mặt khi nhận hàng', icon: require('../assets/images/cod.png') },
  { key: 'vnpay', label: 'Thanh toán bằng VNPay', icon: require('../assets/images/VnPay.png') },
];

export default function CartScreen() {
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [pharmacyList, setPharmacyList] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'store'>('home');
  const [orderInfo, setOrderInfo] = useState({
    name: '',
    phone: '',
    email: '',
    addressName: '',
    addressPhone: '',
  });
  const [provinceList, setProvinceList] = useState<{label:string,value:string,code:number}[]>([]);
  const [districtList, setDistrictList] = useState<{label:string,value:string,code:number}[]>([]);
  const [wardList, setWardList] = useState<{label:string,value:string,code:number}[]>([]);
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [provinceCode, setProvinceCode] = useState<number|null>(null);
  const [districtCode, setDistrictCode] = useState<number|null>(null);
  const [addressDetail, setAddressDetail] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const router = useRouter();

  useEffect(() => {
    // Load cart như cũ
    AsyncStorage.getItem('cart').then(data => {
      if (data) setCart(JSON.parse(data));
    });

    // Load thông tin người dùng
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        let phone = '';
        if (userStr) {
          const userToken = JSON.parse(userStr);
          phone = userToken.numberPhone ?? userToken.sodienthoai ?? userToken.phoneNumber ?? '';
        }
        if (phone) {
          const res = await fetch(`https://be-ecom-longchau-production-hehe.up.railway.app/identityuser/getUserByPhone/${phone}`);
          const data = await res.json();
          if (data?.data) {
            setOrderInfo(info => ({
              ...info,
              name: data.data.hoten ?? '',
              phone: data.data.sodienthoai ?? '',
              email: data.data.email ?? '',
              addressName: data.data.hoten ?? '',
              addressPhone: data.data.sodienthoai ?? '',
            }));
          }
        }
      } catch (e) {
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
      }
    })();

    // Fetch danh sách tỉnh/thành khi mount
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => {
        setProvinceList([{label:'Chọn tỉnh/thành phố',value:'',code:0}, ...data.map((p:any) => ({label:p.name,value:p.name,code:p.code}))]);
      });
  }, []);

  // Fetch danh sách quận/huyện khi chọn tỉnh
  useEffect(() => {
    if (!provinceCode) {
      setDistrictList([{label:'Chọn quận/huyện',value:'',code:0}]);
      setDistrict('');
      setWardList([{label:'Chọn phường/xã',value:'',code:0}]);
      setWard('');
      return;
    }
    fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
      .then(res => res.json())
      .then(data => {
        setDistrictList([{label:'Chọn quận/huyện',value:'',code:0}, ...(data.districts||[]).map((d:any) => ({label:d.name,value:d.name,code:d.code}))]);
        setDistrict('');
        setWardList([{label:'Chọn phường/xã',value:'',code:0}]);
        setWard('');
      });
  }, [provinceCode]);

  // Fetch danh sách phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (!districtCode) {
      setWardList([{label:'Chọn phường/xã',value:'',code:0}]);
      setWard('');
      return;
    }
    fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
      .then(res => res.json())
      .then(data => {
        setWardList([{label:'Chọn phường/xã',value:'',code:0}, ...(data.wards||[]).map((w:any) => ({label:w.name,value:w.name,code:w.code}))]);
        setWard('');
      });
  }, [districtCode]);

  const cleanLocationName = (name: string) => {
    return name.replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã)\s+/i, '');
  };

  // Fetch danh sách nhà thuốc khi chọn tỉnh/thành và quận/huyện
  useEffect(() => {
    if (!province || !district) {
      setPharmacyList([]);
      setSelectedPharmacy('');
      return;
    }
    const cleanProvince = cleanLocationName(province);
    const cleanDistrict = cleanLocationName(district);
    
    fetch(`https://be-ecom-longchau-production-hehe.up.railway.app/pharmacy/findPharmacyByProvinces/${encodeURIComponent(cleanProvince)}/${encodeURIComponent(cleanDistrict)}`)
      .then(res => res.json())
      .then(data => {
        setPharmacyList(data?.data || []);
        setSelectedPharmacy('');
      })
      .catch(err => {
        console.error('Error fetching pharmacies:', err);
        setPharmacyList([]);
        setSelectedPharmacy('');
      });
  }, [province, district]);

  const total = cart.reduce((sum, item) => 
      sum + ((item.chitietdonvi?.[0]?.giaban || 0) * (item.quantity || 1)), 0);

  const renderItem = ({ item }: { item: CartProduct }) => (
    <View style={styles.item}>
      <Image source={item.anhsanpham?.[0]?.url ? { uri: item.anhsanpham[0].url } : require('../assets/images/danhmuc.webp')} style={styles.itemImage} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemName} numberOfLines={2}>{item.tensanpham}</Text>
        {/* Hiển thị giá (đã được cập nhật để sử dụng giá sau khuyến mãi khi thêm vào giỏ hàng) */}
        <Text style={styles.itemPrice}>
          {item.chitietdonvi?.[0]?.giaban?.toLocaleString() || 'Không rõ'}đ
          <Text style={{ color: '#888' }}>
            {' '}x1 {item.chitietdonvi?.[0]?.donvitinh?.donvitinh || ''}
          </Text>
        </Text>
      </View>
    </View>
  );

  // Sau khi nhận được link VNPAY trả về từ API create-payment-url, gọi hàm này để xác thực thanh toán
  const handleVnpayReturnUrl = async (vnpUrl: string) => {
    console.log('[VNPAY] handleVnpayReturnUrl - Nhận URL:', vnpUrl);
    // Tách params và gửi 1 lần duy nhất lên verify-payment
    const queryString = vnpUrl.split('?')[1] || vnpUrl;
    if (queryString) {
      const params: Record<string, string> = {};
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value || '');
      });
      console.log('[VNPAY] Params gửi verify-payment:', params);
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        console.log('[VNPAY] accessToken:', accessToken);
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
        console.log('[VNPAY] verify-payment status:', res.status);
        console.log('[VNPAY] verify-payment response:', data);
        if (res.ok && (data.success || data.data?.success)) {
          alert('Đặt hàng thành công!');
          await AsyncStorage.removeItem('cart');
          setCart([]);
          router.replace('/');
        } else {
          alert('Thanh toán chưa thành công!\n' + (data?.message ?? JSON.stringify(data)));
        }
      } catch (e) {
        console.log('[VNPAY] Lỗi khi gọi verify-payment:', e);
        alert('Lỗi khi kiểm tra trạng thái thanh toán!');
      }
    } else {
      console.log('[VNPAY] Không tìm thấy queryString trong URL:', vnpUrl);
    }
  };

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      console.log('[VNPAY] Deep link nhận được:', event.url);
      // Kiểm tra nếu là callback từ VNPAY (ví dụ: có tham số vnp_Amount, vnp_TxnRef...)
      if (event.url && event.url.includes('vnp_')) {
        // Tránh gọi lặp lại nếu đã xác thực rồi (có thể thêm cờ nếu cần)
        await handleVnpayReturnUrl(event.url);
      } else {
        console.log('[VNPAY] Deep link KHÔNG phải từ VNPAY:', event.url);
      }
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);
    // Không tự động gọi verify-payment khi app khởi động lại
    // Nếu cần, chỉ gọi handleVnpayReturnUrl khi thực sự có link VNPAY
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header giống home */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.replace('/') }>
              <Image source={require('../assets/images/menu.webp')} style={styles.menuIcon} />
            </TouchableOpacity>
            <Image source={require('../assets/images/logo.webp')} style={styles.logo} />
            <Image source={require('../assets/images/bell.png')} style={styles.bell} />
          </View>
          <View style={{ marginTop: 0 }}>
            <View style={styles.searchBarFake}>
              <Text style={{ color: '#888', fontSize: 15 }}>Tìm sản phẩm, thương hiệu...</Text>
            </View>
          </View>
        </View>
        {/* Quay lại giỏ hàng */}
        <TouchableOpacity style={{margin: 16, marginBottom: 0}} onPress={() => router.replace('/cart-list')}>
          <Text style={{color: '#0078D4', fontWeight: 'bold', fontSize: 16}}>{'< Quay lại giỏ hàng'}</Text>
        </TouchableOpacity>
        {/* Danh sách sản phẩm */}
        <Text style={{fontWeight: 'bold', fontSize: 16, margin: 16, marginBottom: 0}}>Danh sách sản phẩm</Text>
        {cart.length === 0 ? (
          <Text style={styles.empty}>Chưa có sản phẩm nào trong giỏ hàng.</Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {cart.map(item => (
              <View key={item.id} style={styles.item}>
                <Image
                  source={item.anhsanpham?.[0]?.url ? { uri: item.anhsanpham[0].url } : require('../assets/images/danhmuc.webp')}
                  style={styles.itemImage}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.tensanpham}</Text>
                  {/* Hiển thị giá (đã được cập nhật để sử dụng giá sau khuyến mãi khi thêm vào giỏ hàng) */}
                  <Text style={styles.itemPrice}>
                    {item.chitietdonvi?.[0]?.giaban?.toLocaleString() || 'Không rõ'}đ
                    <Text style={{ color: '#888' }}>
                      {' '}x{item.quantity || 1} {item.chitietdonvi?.[0]?.donvitinh?.donvitinh || ''}
                    </Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {/* Chọn hình thức nhận hàng */}
        <View style={{flexDirection:'row',margin:16,marginTop:0,backgroundColor:'#f2f6fa',borderRadius:12}}>
          <TouchableOpacity style={{flex:1,padding:12,alignItems:'center',borderRadius:12,backgroundColor:deliveryType==='home'?'#fff':'#f2f6fa'}} onPress={()=>setDeliveryType('home')}>
            <Text style={{color:deliveryType==='home'?'#0078D4':'#888',fontWeight:'bold'}}>Giao hàng tận nhà</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{flex:1,padding:12,alignItems:'center',borderRadius:12,backgroundColor:deliveryType==='store'?'#fff':'#f2f6fa'}} onPress={()=>setDeliveryType('store')}>
            <Text style={{color:deliveryType==='store'?'#0078D4':'#888',fontWeight:'bold'}}>Nhận tại nhà thuốc</Text>
          </TouchableOpacity>
        </View>
        {/* Thông tin người đặt */}
        <View style={{marginHorizontal:16,marginTop:8,backgroundColor:'#fff',borderRadius:12,padding:12}}>
          <Text style={{fontWeight:'bold',fontSize:15,marginBottom:8}}>Thông tin người đặt</Text>
          <TextInput style={styles.input} placeholder="Họ và tên người đặt" value={orderInfo.name} onChangeText={v=>setOrderInfo(o=>({...o,name:v}))} />
          <TextInput style={styles.input} placeholder="Số điện thoại" value={orderInfo.phone} onChangeText={v=>setOrderInfo(o=>({...o,phone:v}))} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Email (không bắt buộc)" value={orderInfo.email} onChangeText={v=>setOrderInfo(o=>({...o,email:v}))} keyboardType="email-address" />
        </View>
        {/* Địa chỉ nhận hàng hoặc chọn nhà thuốc lấy hàng */}
        {deliveryType === 'home' ? (
          // Địa chỉ nhận hàng như cũ
          <View style={{marginHorizontal:16,marginTop:8,backgroundColor:'#fff',borderRadius:12,padding:12}}>
            <Text style={{fontWeight:'bold',fontSize:15,marginBottom:8}}>Địa chỉ nhận hàng</Text>
            <TextInput
              style={styles.input}
              placeholder="Họ và tên người nhận"
              value={orderInfo.addressName}
              onChangeText={v=>setOrderInfo(o=>({...o,addressName:v}))}
            />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={orderInfo.addressPhone}
              onChangeText={v=>setOrderInfo(o=>({...o,addressPhone:v}))}
              keyboardType="phone-pad"
            />
            {/* Chọn tỉnh/thành phố động */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={province}
                onValueChange={(value, idx) => {
                  setProvince(value);
                  setProvinceCode(provinceList[idx]?.code || null);
                  setDistrict('');
                  setDistrictCode(null);
                  setWard('');
                }}>
                {provinceList.map(p => (
                  <Picker.Item key={p.code} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>
            {/* Chọn quận/huyện động */}
            <View style={styles.pickerWrapper}>
              <Picker
                enabled={!!province && !!provinceCode}
                selectedValue={district}
                onValueChange={(value, idx) => {
                  setDistrict(value);
                  setDistrictCode(districtList[idx]?.code || null);
                  setWard('');
                }}>
                {districtList.map(d => (
                  <Picker.Item key={d.code} label={d.label} value={d.value} />
                ))}
              </Picker>
            </View>
            {/* Chọn phường/xã động */}
            <View style={styles.pickerWrapper}>
              <Picker
                enabled={!!district && !!districtCode}
                selectedValue={ward}
                onValueChange={setWard}>
                {wardList.map(w => (
                  <Picker.Item key={w.code} label={w.label} value={w.value} />
                ))}
              </Picker>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa chỉ cụ thể"
              value={addressDetail}
              onChangeText={setAddressDetail}
            />
            <TextInput
              style={[styles.input, {height: 60}]}
              placeholder="Ghi chú (không bắt buộc)\nVí dụ: Hãy gọi cho tôi 15 phút trước khi giao"
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>
        ) : (
          // Chọn nhà thuốc lấy hàng
          <View style={{marginHorizontal:16,marginTop:8,backgroundColor:'#fff',borderRadius:12,padding:12}}>
            <Text style={{fontWeight:'bold',fontSize:15,marginBottom:8}}>Chọn nhà thuốc lấy hàng</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={province}
                onValueChange={(value, idx) => {
                  setProvince(value);
                  setProvinceCode(provinceList[idx]?.code || null);
                  setDistrict('');
                  setDistrictCode(null);
                }}>
                {provinceList.map(p => (
                  <Picker.Item key={p.code} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                enabled={!!province && !!provinceCode}
                selectedValue={district}
                onValueChange={(value, idx) => {
                  setDistrict(value);
                  setDistrictCode(districtList[idx]?.code || null);
                }}>
                {districtList.map(d => (
                  <Picker.Item key={d.code} label={d.label} value={d.value} />
                ))}
              </Picker>
            </View>

            {/* Danh sách nhà thuốc */}
            {pharmacyList.length > 0 && (
              <View style={{marginTop: 8}}>
                <Text style={{fontSize: 15, color: '#666', marginBottom: 8}}>Chọn nhà thuốc để lấy hàng:</Text>
                {pharmacyList.map(pharmacy => (
                  <TouchableOpacity
                    key={pharmacy.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderWidth: 1,
                      borderColor: selectedPharmacy === pharmacy.machinhanh ? '#0078D4' : '#eee',
                      backgroundColor: selectedPharmacy === pharmacy.machinhanh ? '#f0f9ff' : '#fff',
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                    onPress={() => setSelectedPharmacy(pharmacy.machinhanh)}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selectedPharmacy === pharmacy.machinhanh ? '#0078D4' : '#ccc',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      {selectedPharmacy === pharmacy.machinhanh && (
                        <View style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#0078D4'
                        }} />
                      )}
                    </View>
                    <Text style={{
                      flex: 1,
                      fontSize: 14,
                      color: selectedPharmacy === pharmacy.machinhanh ? '#0078D4' : '#333'
                    }}>
                      {pharmacy.diachi}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={[styles.input, {height: 60}]}
              placeholder="Ghi chú (không bắt buộc)\nThêm ghi chú (ví dụ: Gọi cho tôi khi chuẩn bị hàng xong.)"
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>
        )}
        {/* Chọn phương thức thanh toán */}
        <View style={{marginHorizontal:16,marginTop:8,backgroundColor:'#fff',borderRadius:12,padding:12}}>
          <Text style={{fontWeight:'bold',fontSize:15,marginBottom:8}}>Chọn phương thức thanh toán</Text>
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.key}
              style={{flexDirection:'row',alignItems:'center',paddingVertical:10}}
              onPress={() => setPaymentMethod(method.key)}
              activeOpacity={0.7}
            >
              <View style={{
                width:22, height:22, borderRadius:11, borderWidth:2,
                borderColor: paymentMethod === method.key ? '#0078D4' : '#bbb',
                alignItems:'center', justifyContent:'center', marginRight:12
              }}>
                {paymentMethod === method.key ? <View style={{width:12,height:12,borderRadius:6,backgroundColor:'#0078D4'}} /> : null}
              </View>
              <Image source={method.icon} style={{width:28,height:28,marginRight:10}} resizeMode="contain" />
              <Text style={{fontSize:15,flex:1}}>{method.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Ưu đãi */}
        <TouchableOpacity style={{margin:16,marginTop:8,backgroundColor:'#f2f6fa',borderRadius:12,padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <Text style={{color:'#0078D4',fontWeight:'bold'}}>Áp dụng ưu đãi để được giảm giá</Text>
          <Text style={{color:'#888'}}>›</Text>
        </TouchableOpacity>
        {/* Thành tiền + Hoàn tất */}
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',margin:16,marginTop:0}}>
          <Text style={{fontWeight:'bold',fontSize:18,color:'#003366'}}>Thành tiền</Text>
          <Text style={{fontWeight:'bold',fontSize:18,color:'#0078D4'}}>{total.toLocaleString()}đ</Text>
        </View>
        <TouchableOpacity
          style={{backgroundColor:'#0078D4',marginHorizontal:16,borderRadius:20,paddingVertical:14,marginBottom:24}}
          onPress={async () => {
            // Chuẩn bị dữ liệu gửi API
            const paymentMethodValue = paymentMethod === 'cod'
              ? PaymentMethod.CashOnDelivery
              : PaymentMethod.BankTransfer;
            const deliveryTypeValue = deliveryType === 'home'
              ? DeliveryMethod.HomeDelivery
              : DeliveryMethod.PickUpAtPharmacy;

            const orderData = {
              phuongthucthanhtoan: paymentMethodValue,
              hinhthucnhanhang: deliveryTypeValue,
              mavoucher: null,
              tongtien: total,
              giamgiatructiep: 0,
              thanhtien: total,
              phivanchuyen: 0,
              machinhhanh: deliveryType === 'store' ? selectedPharmacy : null,
              details: cart.map(item => ({
                masanpham: item.masanpham,
                soluong: item.quantity || 1,
                giaban: item.chitietdonvi?.[0]?.giaban || 0,
                donvitinh: item.chitietdonvi?.[0]?.donvitinh?.donvitinh || '',
              })),
            };

            console.log('orderData:', orderData);

           const accessToken = await AsyncStorage.getItem('accessToken');
            try {
              const res = await fetch('https://be-ecom-longchau-production-hehe.up.railway.app/purchase-order/createNewPurchaseOrder', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(orderData),
              });
              const data = await res.json();
              console.log('API response:', data);
              if (res.ok) {
                if (paymentMethod === 'vnpay') {
                  try {
                    // Sửa: Lấy amount và madonhang từ data.data
                    console.log('Gửi lên BE:', {
                      amount: data.data?.thanhtien,
                      madonhang: data.data?.madonhang,
                      typeofAmount: typeof data.data?.thanhtien,
                      typeofMadonhang: typeof data.data?.madonhang,
                    });
                    const paymentRes = await fetch('https://be-ecom-longchau-production-hehe.up.railway.app/purchase-order/create-payment-url', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify({
                        amount: data.data?.thanhtien,
                        madonhang: data.data?.madonhang,
                      }),
                    });
                    const paymentData = await paymentRes.json();
                    const url = paymentData?.data?.data?.url;
                    if (url) {
                      // Chuyển sang màn hình WebView thay vì Linking.openURL
                      router.push({ pathname: '/vnpay-webview', params: { url } });
                    } else {
                      console.log('VNPAY paymentData:', paymentData);
                      alert('Không lấy được link thanh toán VnPay!\n' + (paymentData?.message || JSON.stringify(paymentData)));
                    }
                  } catch (e) {
                    alert('Lỗi khi tạo link thanh toán VnPay!');
                  }
                } else {
                  alert('Đặt hàng thành công!');
                  await AsyncStorage.removeItem('cart');
                  setCart([]);
                  router.replace('/');
                }
              } else {
                alert('Đặt hàng thất bại: ' + (data?.message?.message || data?.message || JSON.stringify(data, null, 2) || 'Lỗi không xác định'));
              }
            } catch (error) {
              alert('Lỗi kết nối, vui lòng thử lại!');
              console.log('API error:', error);
            }
          }}
        >
          <Text style={{color:'#fff',fontWeight:'bold',textAlign:'center',fontSize:17}}>Hoàn tất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  headerContainer: {
    backgroundColor: '#0078D4',
    paddingHorizontal: 16,
    paddingTop: 48,
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
  searchBarFake: {
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0078D4',
    marginBottom: 16,
    marginTop: 16,
    alignSelf: 'center',
  },
  empty: {
    fontSize: 16,
    color: '#888',
    alignSelf: 'center',
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
  input: {
    backgroundColor: '#f7f8fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f7f8fa',
    overflow: 'hidden',
  },
});
