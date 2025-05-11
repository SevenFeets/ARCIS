import { Box } from '@chakra-ui/react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import RegisterPage from './pages/RegisterPage'

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
        </Routes>
      </Box>
      <Footer />
    </Box>
  )
}

export default App
