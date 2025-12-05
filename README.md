- Node.js >= 16.x
- MongoDB >= 5.x

```bash
# 1. Cài dependencies
cd backend && npm install
cd ../frontend-user && npm install
cd ../frontend-admin && npm install

# 2. Khởi động MongoDB
mongod

# 3. Tạo admin
cd backend && npm run create-admin

# 4. Chạy hệ thống (3 terminal)
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend-user && npm run dev

# Terminal 3:
cd frontend-admin && npm run dev
```

## TRUY CẬP

- **User:** http://localhost:3000
- **Admin:** http://localhost:3001
  - Email: admin@library.com
  - Pass: admin123

## SCRIPTS

```bash
cd backend
npm run create-admin    # Tạo admin
npm run check-db       # Kiểm tra database
```
