"use client"

import type React from "react"
import styled, { keyframes } from "styled-components"

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const Spinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
`

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`

interface LoadingSpinnerProps {
  style?: React.CSSProperties
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ style }) => {
  return (
    <Container style={style}>
      <Spinner />
    </Container>
  )
}
