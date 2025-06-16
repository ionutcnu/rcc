# ci-container/Dockerfile

# 1) Base on the official Bun image (gives us bun)
FROM oven/bun:1.2.16

# 2) Install Node, npm, git, unzip, Cypress deps, plus mocha-junit-reporter globally
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
    && npm install --global \
         wait-on \
         mocha-junit-reporter \
    && rm -rf /var/lib/apt/lists/*

# 3) Copy in the CI script
COPY entrypoint.sh /usr/local/bin/ci-entrypoint.sh
RUN chmod +x /usr/local/bin/ci-entrypoint.sh

# 4) Run it on container start
ENTRYPOINT ["/usr/local/bin/ci-entrypoint.sh"]
