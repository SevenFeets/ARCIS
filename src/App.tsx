import { Box } from '@chakra-ui/react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import RegisterPage from './pages/RegisterPage'
import PrivateRoute from './components/ui/privateRoute'
import ProfilePage from './pages/ProfilePage'
import AuthTester from './components/tests/AuthTester'
import ApiTest from './components/ApiTest'
import SimpleApiTest from './components/SimpleApiTest'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Box
      minH="100vh"
      bg="var(--chakra-colors-chakra-body-bg)"
      color="var(--chakra-colors-chakra-body-text)"
    >
      <Navbar />
      <Box flex="1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<HomePage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          <Route path="/auth-test" element={<AuthTester />} />
          <Route path="/api-test" element={<ApiTest />} />
          <Route path="/simple-api-test" element={<SimpleApiTest />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  )
}

export default App
