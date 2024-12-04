
# ProjectN
API for a service for professional programmers and enthusiasts. With an authentication system, admin panel, post management system, comments and likes.
## Screenshots

![Screenshot1](https://i.imgur.com/ZC4YCZT.png)
![Screenshot2](https://i.imgur.com/KjykWbH.png)
![Screenshot3](https://i.imgur.com/55HAWXY.png)
![Screenshot4](https://i.imgur.com/3lo7nh0.png)


## Requirements and dependencies

- Node
- npm
- Redis
- Mysql

### Ubuntu
[Install node and npm](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04)

```bash
sudo apt update
sudo apt install nodejs
sudo apt install npm
```
[Install Redis](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-20-04)
```bash
sudo apt install redis-server
```
[Install Mysql](https://www.digitalocean.com/community/tutorials/how-to-install-mysql-on-ubuntu-20-04)

[Remove password root](https://askubuntu.com/questions/1013955/how-remove-or-reset-mysql-password)
```bash
sudo apt install mysql-server
sudo systemctl start mysql.service
```

### MacOS
[Install node and npm](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-and-create-a-local-development-environment-on-macos)

[Install Redis](https://www.liquidweb.com/blog/install-redis-macos-windows/)

[Install Mysql](https://medium.com/@rodolfovmartins/how-to-install-mysql-on-mac-959df86a5319)

## Features

- Focus on data security
- Authentication and authorization system
- Basic functionality for the service
## Installation

**Before installing and running Install dependencies**

#### Install with example database:

```bash
  mysql -u root < db.sql
  npm install
  node index.js
```

#### Installation with your own database:

Create your own database based on table names and data from db.sql.
Editing the config.env file.

```bash
  npm install
  node index.js
```
## Documentation

[Documentation](https://projectn.gitbook.io/projectn-api)

