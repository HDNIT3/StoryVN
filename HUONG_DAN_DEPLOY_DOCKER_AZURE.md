# 🚀 Hướng Dẫn Toàn Tập: Đưa Docker Compose (Backend + Redis) Lên Azure & Vercel
### Tự host 100% không dùng Redis Cloud • Tự động CI/CD GitHub Actions

---

## 📌 1. Sơ Đồ Quy Trình Hoạt Động (Architecture Flow)

```mermaid
flowchart TD
    subgraph Developer["1. Bạn code trên máy tính"]
        A[git push origin main]
    end

    subgraph GitHub["2. GitHub Actions (CI/CD)"]
        B[Tự động Build Backend Dockerfile]
        C[Đẩy Image lên Docker Hub]
        B --> C
    end

    subgraph DockerHub["3. Docker Hub"]
        D[(your_username/storyvn-backend:latest)]
        E[(redis:7-alpine)]
    end

    subgraph Azure["4. Azure App Service (Chạy file docker-compose)"]
        subgraph DockerNetwork["Mạng Nội Bộ Docker"]
            F[Container: Backend NestJS :3001]
            G[Container: Redis Server :6379]
            F <-->|redis://redis:6379| G
        end
    end

    subgraph Vercel["5. Vercel (Frontend)"]
        H[React / Vue / Next.js Web App]
    end

    A --> B
    C --> D
    D -->|Webhook báo Azure kéo bản mới| F
    E -->|Kéo image Redis gốc| G
    H -->|Gọi API HTTPS| F
```

---

## 📂 2. Tổng Hợp Các File Cần Tạo (Đã Điền Đầy Đủ Biến Môi Trường)

### 📄 File 1: `backend/Dockerfile`
> **Vị trí tạo:** `c:\Users\nguye\Desktop\CodeDoAn\backend\Dockerfile`

```dockerfile
# Giai đoạn 1: Build mã nguồn TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Giai đoạn 2: Image Production siêu nhẹ
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads
EXPOSE 3001
CMD ["node", "dist/main"]
```

---

### 📄 File 2: `backend/.dockerignore`
> **Vị trí tạo:** `c:\Users\nguye\Desktop\CodeDoAn\backend\.dockerignore`

```dockerignore
node_modules
dist
.env
.env.*
.git
.gitignore
README.md
test
coverage
*.log
uploads/*
!uploads/.gitkeep
```

---

### 📄 File 3: `docker-compose.yml` (Dùng để chạy test ở máy Local)
> **Vị trí tạo:** `c:\Users\nguye\Desktop\CodeDoAn\docker-compose.yml`  
> *(Đã điền sẵn 100% biến môi trường từ file .env của bạn)*

```yaml
version: '3.8'

services:
  # 1. Redis container nội bộ
  redis:
    image: redis:7-alpine
    container_name: storyvn-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - storyvn-network

  # 2. Backend NestJS
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: storyvn-backend
    restart: always
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      REDIS_URI: redis://redis:6379
      MONGODB_URI: "mongodb://hdn:123@ac-lu7qsdt-shard-00-00.qz7ls7n.mongodb.net:27017,ac-lu7qsdt-shard-00-01.qz7ls7n.mongodb.net:27017,ac-lu7qsdt-shard-00-02.qz7ls7n.mongodb.net:27017/storyvn?ssl=true&replicaSet=atlas-nsyqyv-shard-0&authSource=admin&appName=storyvn"
      MAIL_USER: "nguyenhuynh.463459@gmail.com"
      MAIL_PASS: "npsf ywya zpyz dfcq"
      JWT_SECRET: "storyvn_jwt_secret_key_super_secret_2026_auth_service"
      JWT_EXPIRES_IN: "15m"
      REFRESH_TOKEN_EXPIRES_IN: "7d"
      JWT_REFRESH_SECRET: "storyvn_refresh_jwt_secret_key_super_secret_2026_auth_service"
      UPLOAD_CLOUD: "true"
      APP_URL: "http://localhost:3001"
      CLOUDINARY_CLOUD_NAME: "tc7cgpju"
      CLOUDINARY_API_KEY: "655897282632529"
      CLOUDINARY_API_SECRET: "AdADlHhh7H0K7CbYvgzOTbiEebo"
      GOOGLE_CLIENT_ID: "325988829272-hvelsgs3c6tkv55tj9nv94n0693pmcqk.apps.googleusercontent.com"
    depends_on:
      - redis
    networks:
      - storyvn-network

volumes:
  redis_data:

networks:
  storyvn-network:
    driver: bridge
```

---

### 📄 File 4: `.github/workflows/deploy.yml` (CI/CD Đẩy lên Docker Hub)
> **Vị trí tạo:** `c:\Users\nguye\Desktop\CodeDoAn\.github\workflows\deploy.yml`

```yaml
name: CI/CD Build and Push to Docker Hub

on:
  push:
    branches:
      - main # Đổi thành master nếu nhánh chính của bạn tên master
    paths:
      - 'backend/**'
      - '.github/workflows/deploy.yml'

jobs:
  build-and-push:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest

    steps:
      - name: 1. Checkout Code
        uses: actions/checkout@v4

      - name: 2. Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 3. Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: 4. Build and Push Image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/storyvn-backend:latest
```

---

## ☁️ 3. ĐOẠN CODE DÁN TRỰC TIẾP VÀO AZURE (ĐÃ ĐIỀN ĐẦY ĐỦ ENV)

> [!TIP]
> Bạn chỉ cần **copy toàn bộ đoạn dưới đây và dán thẳng vào ô Docker Compose trên Azure Portal**.
> *(Lưu ý: Chỉ cần sửa duy nhất chữ `your_dockerhub_username` thành tên tài khoản Docker Hub thật của bạn)*.

```yaml
version: '3.8'

services:
  # 1. Container Redis tự host trên Azure
  redis:
    image: redis:7-alpine
    container_name: storyvn-redis
    restart: always
    ports:
      - "6379:6379"

  # 2. Container Backend lấy từ Docker Hub
  backend:
    image: your_dockerhub_username/storyvn-backend:latest
    container_name: storyvn-backend
    restart: always
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      WEBSITES_PORT: 3001
      REDIS_URI: redis://redis:6379
      MONGODB_URI: "mongodb://hdn:123@ac-lu7qsdt-shard-00-00.qz7ls7n.mongodb.net:27017,ac-lu7qsdt-shard-00-01.qz7ls7n.mongodb.net:27017,ac-lu7qsdt-shard-00-02.qz7ls7n.mongodb.net:27017/storyvn?ssl=true&replicaSet=atlas-nsyqyv-shard-0&authSource=admin&appName=storyvn"
      MAIL_USER: "nguyenhuynh.463459@gmail.com"
      MAIL_PASS: "npsf ywya zpyz dfcq"
      JWT_SECRET: "storyvn_jwt_secret_key_super_secret_2026_auth_service"
      JWT_EXPIRES_IN: "15m"
      REFRESH_TOKEN_EXPIRES_IN: "7d"
      JWT_REFRESH_SECRET: "storyvn_refresh_jwt_secret_key_super_secret_2026_auth_service"
      UPLOAD_CLOUD: "true"
      CLOUDINARY_CLOUD_NAME: "tc7cgpju"
      CLOUDINARY_API_KEY: "655897282632529"
      CLOUDINARY_API_SECRET: "AdADlHhh7H0K7CbYvgzOTbiEebo"
      GOOGLE_CLIENT_ID: "325988829272-hvelsgs3c6tkv55tj9nv94n0693pmcqk.apps.googleusercontent.com"
    depends_on:
      - redis
```

---

## 🖱️ 4. Từng Bước Thực Hiện Trên Azure Portal

1. Truy cập [Azure Portal](https://portal.azure.com/) ➔ Tìm dịch vụ **App Services** ➔ Nhấn **Create** ➔ Chọn **Web App**.
2. **Tab Basics:**
   - **Resource Group**: Chọn hoặc tạo mới (ví dụ `storyvn-rg`).
   - **Name**: Đặt tên (ví dụ: `storyvn-api` ➔ URL: `https://storyvn-api.azurewebsites.net`).
   - **Publish**: Tích chọn **Docker Container**.
   - **Operating System**: Chọn **Linux**.
   - **Region**: Chọn `Southeast Asia` (Singapore).
   - **Pricing Plan**: Chọn gói **Basic B1** (Gói tối thiểu hỗ trợ chạy Docker Compose).
3. **Tab Docker:**
   - **Options**: Chọn **Docker Compose**.
   - **Image Source**: Chọn **Docker Hub**.
   - **Access Type**: `Public` (hoặc `Private` nếu bạn đặt repo riêng tư).
   - **Configuration Source**: Chọn **Paste file contents**.
   - 📋 **Dán toàn bộ đoạn mã ở [Mục 3] vào ô soạn thảo**.
4. Nhấn **Review + Create** ➔ Nhấn **Create**.

---

## 🔄 5. Bật Tự Động Deploy (Continuous Deployment)

1. Mở Web App vừa tạo trên Azure ➔ Menu trái chọn **Deployment Center**.
2. Bật **Continuous Deployment** sang **On**.
3. **Copy chuỗi Webhook URL** xuất hiện ở dưới.
4. Mở [Docker Hub](https://hub.docker.com/) ➔ Vào repo `storyvn-backend` ➔ Chọn tab **Webhooks**.
5. Bấm **Create Webhook**:
   - **Name**: `azure-auto-deploy`
   - **Webhook URL**: Dán link vừa copy từ Azure vào ➔ Bấm **Create**.

---

## 🌐 6. Gắn Link Azure Vào Frontend Trên Vercel

1. **Lấy link API Backend:**
   - Link Azure: `https://storyvn-api.azurewebsites.net`
   - Link API đầy đủ: `https://storyvn-api.azurewebsites.net/api`
   - Link Swagger Docs: `https://storyvn-api.azurewebsites.net/api/docs`

2. **Cấu hình trên Vercel:**
   - Mở [Vercel Dashboard](https://vercel.com/) ➔ Chọn dự án Frontend.
   - Vào **Settings** ➔ **Environment Variables**.
   - Thêm biến trỏ về Backend Azure:
     ```env
     VITE_API_URL=https://storyvn-api.azurewebsites.net/api
     ```
   - Bấm **Save**.
3. **Redeploy:** Vào tab **Deployments** trên Vercel ➔ Nhấn dấu **3 chấm** ở bản deploy mới nhất ➔ Chọn **Redeploy**.

---

## 🩺 7. Bảng Kiểm Tra Xử Lý Sự Cố

| Hiện tượng | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- |
| **502 Bad Gateway** | Azure chưa tìm thấy cổng 3001 | Đảm bảo trong YAML có `WEBSITES_PORT: 3001` và `PORT: 3001`. |
| **Lỗi MongoDB timeout** | IP của Azure chưa được whitelist trên MongoDB Atlas | Vào MongoDB Atlas ➔ **Network Access** ➔ Thêm IP `0.0.0.0/0` (Allow Access from Anywhere). |
| **Lỗi Redis ECONNREFUSED** | Sai tên host kết nối | Đảm bảo biến `REDIS_URI` là `redis://redis:6379`. |
| **Xem log trực tiếp** | Cần theo dõi khi ứng dụng chạy | Vào Web App trên Azure ➔ Menu trái chọn **Log Stream**. |
