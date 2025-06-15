# ci-container/Dockerfile

# 1) Start from the official Bun image (includes bun on PATH)
FROM oven/bun:1.2.16

# 2) Install Node.js, npm, git & unzip (for Cypress & Vercel CLI)
RUN apt-get update && apt-get install -y \
      nodejs \
      npm \
      git \
      unzip \
    && rm -rf /var/lib/apt/lists/*

# 3) Copy in your CI entrypoint script
COPY entrypoint.sh /usr/local/bin/ci-entrypoint.sh
RUN chmod +x /usr/local/bin/ci-entrypoint.sh

# 4) When the container runs, invoke your script
ENTRYPOINT ["/usr/local/bin/ci-entrypoint.sh"]
