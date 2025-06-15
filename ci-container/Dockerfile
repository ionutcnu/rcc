# ─── Use the official Bun image with Node.js pre-installed ────────────────
FROM oven/bun:1.2.16

# ─── Install any extra system tools you need (e.g. git, unzip for Cypress/Vercel) ─
RUN apt-get update && apt-get install -y \
      git \
      unzip \
    && rm -rf /var/lib/apt/lists/*

# ─── Copy in your CI entrypoint script ────────────────────────────────────
COPY entrypoint.sh /usr/local/bin/ci-entrypoint.sh
RUN chmod +x /usr/local/bin/ci-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/ci-entrypoint.sh"]
