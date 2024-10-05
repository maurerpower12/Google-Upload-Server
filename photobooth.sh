#!/bin/bash

# Constants
SERVER_PORT=3000                              # Replace with your server's port
NODE_SERVER_PATH="/Documents/GitHub/Photobooth-Backend" # Path to your Node.js server
ELECTRON_APP_PATH="/Documents/GitHub/Photobooth" # Path to your Electron app
MAX_RETRIES=5                                 # Maximum number of retries for server start
RETRY_INTERVAL=60                              # Time (in seconds) between retries
PING_HOST="8.8.8.8"                           # External server to check internet (Google DNS)

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check for internet connection
check_internet_connection() {
  local retry_internet=1
  while [[ $retry_internet -eq 1 ]]; do
    echo "Checking internet connection..."
    if ping -c 1 "$PING_HOST" &> /dev/null; then
      echo -e "${GREEN}Internet connection is active.${NC}"
      retry_internet=0
    else
      echo -e "${RED}No internet connection detected.${NC}"
      read -p "Do you want to retry the connection (r), proceed offline (o), or exit (e)? " user_choice
      case $user_choice in
        [Rr]* ) echo -e "${YELLOW}Retrying internet connection...${NC}";;
        [Oo]* ) echo -e "${YELLOW}Proceeding offline...${NC}"; retry_internet=0;;
        [Ee]* ) echo -e "${RED}Exiting script due to lack of internet connection.${NC}"; exit 1;;
        * ) echo -e "${YELLOW}Invalid choice. Please enter 'r', 'o', or 'e'.${NC}";;
      esac
    fi
  done
}

# Function to check if the Node.js server has started
check_server_started() {
  local retries=0
  echo "Waiting for server to start on port $SERVER_PORT..."
  until nc -z localhost $SERVER_PORT || [ $retries -eq $MAX_RETRIES ]; do
    retries=$((retries + 1))
    echo -e "${RED}Retry $retries/$MAX_RETRIES: Server not ready yet...${NC}"
    sleep $RETRY_INTERVAL
  done

  if [ $retries -eq $MAX_RETRIES ]; then
    echo -e "${RED}Error: Node.js server failed to start after $MAX_RETRIES attempts.${NC}"
    exit 1
  fi

  echo -e "${GREEN}Server successfully started on port $SERVER_PORT.${NC}"
}

# Start Node.js server
start_node_server() {
  echo "Starting Node.js server..."
  cd "$NODE_SERVER_PATH" || { echo -e "${RED}Error: Failed to navigate to Node.js server directory.${NC}"; exit 1; }
  npm start # Starts the Node.js server
}

# Start Electron app
start_electron_app() {
  echo "Starting Electron app..."
  cd "$ELECTRON_APP_PATH" || { echo -e "${RED}Error: Failed to navigate to Electron app directory.${NC}"; exit 1; }
  npm start  # Start Electron app
  sleep 5  # Wait for the Electron app to start
  echo -e "${GREEN}Electron app successfully started.${NC}"
}

# Main script execution
echo "Initializing..."

# 1. Check for internet connection with retry option
check_internet_connection

# 2. Start Node.js server and check its status
start_node_server
check_server_started  # Automatically assumes authentication is successful if the server starts

# 3. Start the Electron app
start_electron_app

echo -e "${GREEN}All processes started successfully. Exiting.${NC}"
exit 0