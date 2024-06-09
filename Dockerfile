# Use official node image as base image
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn

# Copy the rest of the code
COPY . .

# Generate prisma client
RUN yarn prisma generate


# Expose the port the app runs on
EXPOSE 4000

# Command to run the application
CMD ["node", "server.js"]
