/* =========================================================
   DATA TOKO — edit file ini saja untuk mengganti isi website
   (menu, harga, bundling, kontak, jam buka).
   ========================================================= */
window.RB = {
  shop: {
    name: 'Yum Ricebites',
    tagline: 'your next quick meal starts here.',
    address: 'Sekolah Vokasi IPB, Jl. Kumbang No.14, RT.02/RW.06, Babakan, Kecamatan Bogor Tengah, Kota Bogor, Jawa Barat 16128',
    area: 'Area Klikbi',
    mapQuery: 'Sekolah Vokasi IPB, Jl. Kumbang No.14, Babakan, Bogor Tengah, Kota Bogor',
    hours: { openLabel: '07.00', closeLabel: '13.00', openMin: 7 * 60, closeMin: 13 * 60 },
    whatsapp: '08123456789',
    whatsappIntl: '628123456789',
    instagram: 'yum.ricebites',
    tiktok: 'yumricebites',
    deliveryNote: 'Pengantaran untuk area Klikbi & sekitar Sekolah Vokasi IPB.',
    freeDelivery: true, // tampilkan label "Free Delivery" (sesuai poster)
  },

  // Harga satuan semua varian (poster: "ONLY 5K")
  basePrice: 5000,

  // Paket bundling. Harga = total untuk `qty` pcs (campur rasa bebas).
  // Sistem otomatis memilih kombinasi paling hemat.
  bundles: [
    { qty: 3, price: 13000, name: 'Paket Hemat 3', tag: 'Ngemil bareng' },
    { qty: 5, price: 22000, name: 'Paket Hemat 5', tag: 'Paling laris' },
    { qty: 10, price: 42000, name: 'Paket Hemat 10', tag: 'Satu geng' },
  ],

  // CONTOH MENU — ganti nama, deskripsi, dan foto sesuai produk asli.
  // img: path foto (null = pakai logo sebagai placeholder)
  menu: [
    {
      id: 'ayam-suwir-pedas',
      name: 'Ayam Suwir Kemangi',
      desc: 'Nasi pulen dengan isian ayam suwir berbumbu pedas gurih, dibungkus kertas praktis.',
      img: 'assets/Ayam Sayur Kemangi.jpeg',
      badge: 'Best Seller',
    },
    {
      id: 'ayam-suwir-original',
      name: 'Ayam Chicken Mentai',
      desc: 'Ayam suwir bumbu gurih ringan, cocok untuk yang tidak terlalu suka pedas.',
      img: 'assets/Chicken Mentai.jpeg',
      badge: 'Favorit',
    },
    {
      id: 'telur-balado',
      name: 'Teriyaki',
      desc: 'Telur dengan sambal balado khas yang meresap sampai ke dalam nasi.',
      img: 'assets/Teriyaki.jpeg',
      badge: 'Baru',
    },
    {
      id: 'tuna-mayo',
      name: 'Ayam Rendang',
      desc: 'Tuna creamy dengan saus mayo, lembut dan mengenyangkan.',
      img: 'assets/Ayam Rendang.jpeg',
      badge: '',
    },
  ],
};
