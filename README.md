# Phoot Booth Backend

## Description

This project is the backend for a locally running Photo Booth application. The purpose is to handle saving, uploading, and backend services.

## Table of Contents

- [Phoot Booth Backend](#Phoot-Booth-Backend)
  - [Description](#description)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Local Files](#local-files)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- Handle File uploads (e.g., images)
- Middleware: Saves files locally before uploading.
- Remote uploading: Uploads content to remote services (e.g. Dropbox, Google Photos).
- Handles User Authentication to those services

## Installation

To get up and running, follow these steps:
1. [Download and install Node.js](https://nodejs.org/)
2. [Git clone this repo](https://github.com/maurerpower12/Photobooth-Backend)
3. Install the required dependencies:
```bash
   npm install
```
4. Create the needed local files. See local files section below
5. Configure your remote provider (see `const provider = backendOptions.Dropbox;` in index.js)
5. Start the application
```bash
   npm install
```


## Local Files

To work with remote providers (like Dropbox) there are files that need to be generated:
1. `./dropboxToken.json`
    - This file is generated for you! It will contain your acess token. DO NOT SHARE OR UPLOAD!
2. `./dropboxCredentials.json`
    - This file contains constants that can be found on [developer console](https://www.dropbox.com/developers/)
    - Here is a sample structure:
    ```json
    {
        "DROPBOX_APP_KEY": "1234",
        "DROPBOX_APP_SECRET": "5678",
        "REDIRECT_URI": "http://localhost:3000/auth/dropbox/callback"
    }
    ```

## Contributing

If you'd like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-name`).
6. Create a new Pull Request.

## License

This project is licensed under the [MIT License](https://opensource.org/license/mit).
```
Copyright 2024 Joseph Maurer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```