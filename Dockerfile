FROM mcr.microsoft.com/playwright:v1.39.0-jammy

RUN npm install -g netlify-cli serve \
    && apt-get update \
    && apt-get install -y --no-install-recommends jq \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app