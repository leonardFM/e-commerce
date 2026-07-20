# Plan: Postman Collection Seluruh Endpoint

## Tujuan

Membuat file Postman collection `.json` yang mencakup seluruh endpoint API project, lengkap dengan contoh request, query params, body JSON, dan contoh penyertaan token untuk endpoint protected.

## Output

File baru yang disarankan:

`postman/solutech-commerce-api.postman_collection.json`

Isi collection:

- Variable `baseUrl`, default `http://localhost:3000`
- Variable `customerToken`
- Variable `adminToken`
- Variable contoh ID seperti `productId` dan `orderId`
- Folder endpoint per domain
- Request login/register tanpa auth
- Request protected dengan `Authorization: Bearer {{customerToken}}` atau `{{adminToken}}`
- Optional test script pada login untuk otomatis menyimpan token dari response

## Endpoint Yang Dicakup

### Auth

- `POST {{baseUrl}}/api/auth/register`
- `POST {{baseUrl}}/api/auth/login`

### Products

- `GET {{baseUrl}}/api/products?page=1&limit=10&search=`
- `POST {{baseUrl}}/api/products`
- `GET {{baseUrl}}/api/products/{{productId}}`
- `PATCH {{baseUrl}}/api/products/{{productId}}`
- `DELETE {{baseUrl}}/api/products/{{productId}}`

### Cart

- `GET {{baseUrl}}/api/cart`
- `DELETE {{baseUrl}}/api/cart`
- `POST {{baseUrl}}/api/cart/items`
- `PATCH {{baseUrl}}/api/cart/items/{{productId}}`
- `DELETE {{baseUrl}}/api/cart/items/{{productId}}`

### Checkout

- `POST {{baseUrl}}/api/checkout`

### Orders

- `GET {{baseUrl}}/api/orders`
- `POST {{baseUrl}}/api/orders`
- `GET {{baseUrl}}/api/orders/{{orderId}}`

### Admin Orders

- `GET {{baseUrl}}/api/admin/orders?page=1&limit=10`
- `PATCH {{baseUrl}}/api/admin/orders/{{orderId}}/status`
- `PATCH {{baseUrl}}/api/admin/orders/{{orderId}}/payment`

### Inventory

- `GET {{baseUrl}}/api/inventory/movements?page=1&limit=10&productId={{productId}}&type=ADMIN_ADJUSTMENT`
- `POST {{baseUrl}}/api/inventory/adjustments`

## Auth Handling

Collection memakai dua token variable:

- `{{customerToken}}` untuk endpoint customer/protected umum
- `{{adminToken}}` untuk endpoint admin

Contoh body login customer:

```json
{
  "email": "customer@solutech.test",
  "password": "password123"
}
```

Contoh body login admin:

```json
{
  "email": "admin@solutech.test",
  "password": "password123"
}
```

Jika format response login mengandung token di `data.token`, tambahkan Postman test script untuk login customer:

```js
const json = pm.response.json()
pm.collectionVariables.set('customerToken', json.data.token)
```

Untuk login admin:

```js
const json = pm.response.json()
pm.collectionVariables.set('adminToken', json.data.token)
```

## Contoh Body Request

Register customer:

```json
{
  "email": "newcustomer@solutech.test",
  "password": "password123",
  "name": "New Customer"
}
```

Create product, admin:

```json
{
  "name": "Keyboard Mechanical",
  "description": "Keyboard untuk kerja dan gaming",
  "price": 350000,
  "stock": 20
}
```

Update product, admin:

```json
{
  "name": "Keyboard Mechanical Updated",
  "description": "Deskripsi baru",
  "price": 375000,
  "stock": 25
}
```

Add cart item, customer:

```json
{
  "productId": 1,
  "quantity": 2
}
```

Update cart item, customer:

```json
{
  "quantity": 3
}
```

Checkout, customer:

```json
{
  "paymentMethod": "EWALLET",
  "shippingName": "Customer Solutech",
  "shippingPhone": "08123456789",
  "shippingAddress": "Jl. Contoh No. 1",
  "shippingCity": "Jakarta",
  "shippingPostalCode": "12345",
  "shippingCost": 15000,
  "simulatePaymentStatus": "PAID"
}
```

Create order langsung, customer:

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

Update order status, admin:

```json
{
  "status": "PROCESSING"
}
```

Update payment status, admin:

```json
{
  "paymentStatus": "PAID"
}
```

Inventory adjustment, admin:

```json
{
  "productId": 1,
  "quantityChange": 10,
  "note": "Restock manual"
}
```

## Struktur Folder Postman

Collection dibagi menjadi folder:

- `Auth`
- `Products`
- `Cart`
- `Checkout`
- `Orders`
- `Admin Orders`
- `Inventory`

## Langkah Implementasi

1. Buat folder `postman/` jika belum ada.
2. Buat file `postman/solutech-commerce-api.postman_collection.json`.
3. Definisikan collection schema Postman v2.1: `https://schema.getpostman.com/json/collection/v2.1.0/collection.json`.
4. Tambahkan collection variables: `baseUrl`, `customerToken`, `adminToken`, `productId`, dan `orderId`.
5. Tambahkan semua request endpoint sesuai daftar cakupan endpoint.
6. Untuk request protected, tambahkan header `Authorization: Bearer {{customerToken}}` atau `Authorization: Bearer {{adminToken}}`.
7. Tambahkan header `Content-Type: application/json` pada request yang punya body.
8. Tambahkan contoh body JSON sesuai schema Zod di module masing-masing.
9. Tambahkan test script pada request login customer/admin untuk menyimpan token otomatis.
10. Validasi JSON collection dengan parser/formatter agar bisa langsung di-import ke Postman.
11. Jalankan `npm run lint` bila ada perubahan JS/TS. Untuk file JSON Postman saja, lint tidak wajib.
12. Update catatan implementasi di `.opencode/docs/implement/` setelah perubahan selesai.
13. Evaluasi `AGENTS.md`. Kemungkinan tidak perlu update karena hanya menambah artefak dokumentasi/testing, bukan endpoint/env/command baru.

## Verifikasi Manual

1. Import collection ke Postman.
2. Jalankan server dengan `npm run dev`.
3. Login admin dan pastikan `adminToken` tersimpan.
4. Login customer dan pastikan `customerToken` tersimpan.
5. Jalankan `GET /api/products` dengan customer token.
6. Jalankan create/update/delete product dengan admin token.
7. Jalankan flow customer: add cart item, get cart, checkout, get orders.
8. Jalankan flow admin: list orders, update status/payment, inventory adjustment.
9. Pastikan request tanpa token untuk endpoint protected menghasilkan `401`.
10. Pastikan customer token ke endpoint admin menghasilkan `403`.

## Risiko Dan Catatan

- Format response login perlu dicek sebelum final, terutama path token apakah benar `data.token`.
- ID contoh seperti `productId` dan `orderId` bergantung seed/database lokal.
- Endpoint `GET /api/products` saat ini protected karena memakai `requireUser(request)`, jadi collection harus menyertakan customer token meskipun endpoint katalog biasanya publik.
