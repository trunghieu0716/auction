# Sử dụng Node.js 18 trên Alpine để tối ưu kích thước image
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Chỉ copy package.json và package-lock.json để tối ưu cache
COPY package.json package-lock.json ./

# Cài đặt dependencies (chỉ cài package cần thiết)
RUN npm install --only=production

# Copy toàn bộ mã nguồn vào container
COPY . .

# Expose cổng 8000
EXPOSE 8000

# Khởi động ứng dụng
CMD ["npm", "start"]
