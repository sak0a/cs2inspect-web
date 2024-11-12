# Use a lightweight base image
FROM debian:bookworm-slim

# Set working directory
WORKDIR /app

# Install curl to download Bun, and set up essential packages
RUN apt-get update && \
    apt-get install -y curl git && \
    curl -fsSL https://bun.sh/install | bash && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add Bun to the PATH
ENV PATH="/root/.bun/bin:$PATH"

# Copy the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Copy package.json and install dependencies
COPY package*.json ./
RUN bun install

# Copy the rest of the application code
COPY . .

# Build the Nuxt app
RUN bun run build

# Expose port 3000
EXPOSE 3000

# Use the entrypoint script as the container command
ENTRYPOINT ["/app/entrypoint.sh"]