

# 1) Base on the official Bun image (bun already on PATH)
FROM oven/bun:1.2.16

# 2) Install Node.js, npm, git, unzip + Cypress/Chrome deps (incl. Xvfb)
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
    && rm -rf /var/lib/apt/lists/*

# 3) Copy in the CI entrypoint
COPY entrypoint.sh /usr/local/bin/ci-entrypoint.sh
RUN chmod +x /usr/local/bin/ci-entrypoint.sh

# 4) Exec your script on container start
ENTRYPOINT ["/usr/local/bin/ci-entrypoint.sh"]
