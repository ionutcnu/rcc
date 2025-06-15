# ci-container/Dockerfile

# Use the official Bun image (contains bun on PATH)
FROM oven/bun:1.2.16

# Install Node.js, npm, git, unzip + all Cypress / Chrome deps (including Xvfb)
RUN apt-get update && apt-get install -y \
      nodejs \
      npm \
      git \
      unzip \
      # Cypress GUI deps:
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
    && rm -rf /var/lib/apt/lists/*

# Copy your CI script
COPY entrypoint.sh /usr/local/bin/ci-entrypoint.sh
RUN chmod +x /usr/local/bin/ci-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/ci-entrypoint.sh"]
