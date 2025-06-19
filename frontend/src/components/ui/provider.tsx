"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode"

export function Provider({ children }: ColorModeProviderProps) {
  return (
    <ChakraProvider>
      <ColorModeProvider>{children}</ColorModeProvider>
    </ChakraProvider>
  )
}
