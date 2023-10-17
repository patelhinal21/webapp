#!/bin/bash

# Update package lists
sudo apt-get update

# Install MariaDB server
sudo apt-get install mariadb-server -y

# Start MariaDB service
sudo systemctl start mariadb

# Grant privileges to root user
sudo mysql -e "GRANT ALL ON *.* TO 'root'@'localhost' IDENTIFIED BY 'root@2797';"

# Install Node.js and npm
sudo apt install nodejs npm -y

# Install unzip
sudo apt install -y unzip
unzip webapp_test.zip
cd webapp_test
npm i
npm start server.js

