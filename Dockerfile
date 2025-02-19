# Sử dụng image nhẹ hơn
FROM node:18-alpine

# Đặt thư mục làm việc trong container
WORKDIR /app

# Copy file package.json và package-lock.json trước (tối ưu cache layer)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install --production

# Copy toàn bộ source code
COPY . .

# Mở cổng cho ứng dụng
EXPOSE 8000

# Chạy ứng dụng
CMD ["node", "app.js"]
