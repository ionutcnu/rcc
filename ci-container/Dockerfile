FROM ubuntu:22.04

# 1) Install system deps including unzip for Bun
RUN apt-get update && apt-get install -y \
      curl \
      git \
      bash \
      nodejs \
      npm \
      unzip \
    && rm -rf /var/lib/apt/lists/*

# 2) Install Bun v1.2.16 (pass "bun-v1.2.16" as the argument)
RUN curl -fsSL https://bun.sh/install \
  | bash -s bun-v1.2.16

# 3) Copy in your entrypoint
COPY entrypoint.sh /usr/local/bin/ci-entrypoint.sh
RUN chmod +x /usr/local/bin/ci-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/ci-entrypoint.sh"]
