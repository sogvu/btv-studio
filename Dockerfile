FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv ca-certificates && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/yt && /opt/yt/bin/pip install --no-cache-dir "yt-dlp[default]"
RUN mkdir -p /opt/btv-bin && ln -s /usr/bin/ffmpeg /opt/btv-bin/ffmpeg && ln -s /usr/bin/ffprobe /opt/btv-bin/ffprobe && ln -s /opt/yt/bin/yt-dlp /opt/btv-bin/yt-dlp
WORKDIR /app
COPY app ./app
COPY public ./public
COPY package.json .
ENV BTV_CLOUD=1 BTV_DATA=/tmp/btv-data BTV_BIN=/opt/btv-bin PORT=10000
USER node
EXPOSE 10000
CMD ["node","app/server.mjs"]
