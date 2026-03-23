# Use the official Bun image as the base image
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /app

# COPY bun.lock package.json ./

# Install dependencies
# RUN bun install --frozen-lockfile

# Copy the current directory contents into the container at /app
# COPY . .

RUN mkdir -p ./node_modules

# Expose the port on which the API will listen
EXPOSE 8080

# Run the server when the container launches
CMD ["sh", "-c", "bun install && bun dev"]