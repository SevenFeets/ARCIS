import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('./firebase/config', () => ({
    auth: {
        onAuthStateChanged: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        createUserWithEmailAndPassword: jest.fn(),
        signOut: jest.fn()
    },
    db: {}
}));

// Mock environment variables
Object.defineProperty(process.env, 'VITE_API_URL', {
    value: 'http://localhost:5000'
});

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
