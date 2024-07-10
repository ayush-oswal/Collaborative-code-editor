# Use an official node image as the base image
FROM node:18

# Set the working directory
WORKDIR /src

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

RUN npm install @rollup/rollup-linux-x64-gnu

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5173

# Copy the entrypoint script
COPY entrypoint.sh .

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Use the shell to run the entrypoint script
ENTRYPOINT ["sh", "/src/entrypoint.sh"]

# Command to run the app in development mode
CMD ["npm", "run", "dev"]
