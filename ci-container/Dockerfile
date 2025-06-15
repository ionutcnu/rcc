# .github/ci-container/Dockerfile

# 1) Start from the official Bun image
FROM oven/bun:1.2.16

# 2) Install Node.js & npm (plus git/unzip)
RUN apt-get update && apt-get install -y \
      nodejs \
      npm \
      git \
      unzip \
    && rm -rf /var/lib/apt/lists/*

# 3) Copy your entrypoint script
COPY entrypoint.sh /usr/local/bin/ci-entrypoint.sh
RUN chmod +x /usr/local/bin/ci-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/ci-entrypoint.sh"]
