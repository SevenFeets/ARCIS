import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
// import { extendTheme } from '@chakra-ui/theme'

// Color mode config
const config: ThemeConfig = {
    initialColorMode: 'light',
    useSystemColorMode: false,
}

const theme = extendTheme({
    config,
    styles: {
        global: (props: { colorMode: 'light' | 'dark' }) => ({
            body: {
                bg: props.colorMode === 'dark' ? '#1A202C' : '#F7FAFC',
                color: props.colorMode === 'dark' ? '#F7FAFC' : '#1A202C',
            },
        }),
    },
    colors: {
        brand: {
            primary: "#1A365D",    // Navy blue
            secondary: "#CBD5E0",  // Silver/light steel
            accent: "#285E61",     // Deep teal
            light: "#F7FAFC",      // Light gray background
            dark: "#4A5568",       // Slate gray
            100: '#f7fafc',
            // Add more custom colors as needed
            900: '#1a202c',
        },
    },
    fonts: {
        heading: 'system-ui, sans-serif',
        body: 'system-ui, sans-serif',
    },
    components: {
        Card: {
            baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
                container: {
                    bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
                }
            })
        },
        Button: {
            variants: {
                ghost: (props: { colorMode: 'light' | 'dark' }) => ({
                    _hover: {
                        bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.200',
                    }
                })
            }
        }
    },
    // Add more theme customizations as needed
})

export default theme 