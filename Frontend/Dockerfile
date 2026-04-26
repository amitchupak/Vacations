# Inherit Dockerfile containing Linux Alpine + Node.js 24:
FROM node:24-alpine

# Create project folder inside the image:
WORKDIR /app
    
# Copy package.json into /app:
COPY ./Frontend/package.json /app
    
# Install node_modules: 
RUN npm install
    
# Copy our App
COPY ./Frontend /app
    
# -------------------------------------------------------------
    
# Always use base "/" in Docker — not the school code-server /proxy/… base.
ENV VITE_BASE_PATH=""
CMD ["npm", "start"]
    