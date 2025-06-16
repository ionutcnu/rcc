# ci-container/Dockerfile
FROM oven/bun:1.2.16

RUN apt-get update && apt-get install -y \
      nodejs \
      npm \
      git \
      unzip \
      xvfb \
      libgtk2.0-0 \
      libgtk-3-0 \
      libnotify4 \
      libgconf-2-4 \
      libnss3 \
      libxss1 \
      libasound2 \
      libxtst6 \
      xauth \
      fontconfig \
    && npm install --global wait-on \
    && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/ci-entrypoint.sh
RUN chmod +x /usr/local/bin/ci-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/ci-entrypoint.sh"]
