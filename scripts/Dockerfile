# Use the official Node.js image as the base image
FROM node:14

# Install dependencies
RUN apt-get update && apt-get install -y \
    openjdk-11-jre-headless \
    wget \
    unzip

# Set environment variables
ENV NODE_PATH /usr/lib/node_modules
ENV JAVA_HOME /usr/lib/jvm/java-11-openjdk-amd64

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Download and setup Selenium Server
RUN wget https://selenium-release.storage.googleapis.com/3.141/selenium-server-standalone-3.141.59.jar -P /usr/src/app

# Copy the rest of the application code
COPY . .

# Expose the port for Selenium Hub
EXPOSE 4444

# Expose the port the app runs on, if needed (e.g., 8080)
EXPOSE 8080

# Start Selenium Hub and the application
CMD ["sh", "-c", "java -jar /usr/src/app/selenium-server-standalone-3.141.59.jar -role hub & node path/to/your/script.js"]
