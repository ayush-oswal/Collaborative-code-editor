# Use an official node image as the base image
FROM node:18

# Set the working directory
WORKDIR /src

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy the rest of the application code
COPY . .

# Expose the port the server runs on
EXPOSE 8080

# Command to run the server
CMD ["npm", "start"]
