ARCIS website

A modern web application built with React, TypeScript, and Chakra UI featuring user authentication and social login capabilities.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [UI Components](#ui-components)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication (email/password)
- Social login (Google)
- Responsive UI with Chakra UI
- TypeScript for type safety
- Modern React with hooks and context

## Demo

[Add a link to your live demo or screenshots here]

## Technologies Used

- [React](https://reactjs.org/) - Frontend library
- [TypeScript](https://www.typescriptlang.org/) - Static type checking
- [Chakra UI](https://chakra-ui.com/) - Component library
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library
- [Firebase](https://firebase.google.com/) (assumed for auth) - Authentication and backend services

## Getting Started

### Prerequisites

- Node.js (v14.x or later)
- npm or yarn
- VITE - go to google and search for vite get started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/your-project-name.git
   cd your-project-name
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Install Chakra UI and its dependencies:
   ```bash
   npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
   # or
   yarn add @chakra-ui/react @emotion/react @emotion/styled framer-motion
   ```

4. Install React Icons:
   ```bash
   npm install react-icons
   # or
   yarn add react-icons
   ```

5. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

6. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

7. npm commands:
    - npm run dev - to start the development server
    - npm run build - to build the production version
    - npm run deploy - to deploy the production version to github pages
    -npm install react-router-dom

8. chakra ui:
    - npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
    - npm install @chakra-ui/icons
    - npm install @chakra-ui/react-icons
    - npm install @chakra-ui/provider
    - npm install @chakra-ui/react@latest @emotion/react@latest @emotion/styled@latest framer-motion@latest

## Project Structure

```
src/
├── components/         # Reusable UI components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API and service functions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main App component
└── index.tsx           # Entry point
```

## Authentication

This project uses a custom authentication context (`AuthContext`) to manage user authentication. The following authentication methods are supported:

- Email/password login
- Google authentication

To implement authentication, we use [Firebase Authentication](https://firebase.google.com/docs/auth) (or specify your auth provider).

## UI Components

The UI is built with [Chakra UI](https://chakra-ui.com/), a modular and accessible component library for React applications. Key components include:

- Modal dialogs for login/signup
- Form controls with validation
- Responsive layout components
- Toast notifications

## Deployment

### Build for Production

```bash
npm run build
# or
yarn build
```

### Deploy to GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   # or
   yarn add --dev gh-pages
   ```

2. Add the following to your `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/your-project-name",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   # or
   yarn deploy
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 