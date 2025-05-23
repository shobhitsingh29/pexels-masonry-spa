"use client"

import React from "react"
import styled from "styled-components"
import { AlertTriangle, RefreshCw } from "lucide-react"

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 48px 24px;
  text-align: center;
`

const ErrorIcon = styled(AlertTriangle)`
  width: 64px;
  height: 64px;
  color: #ef4444;
  margin-bottom: 24px;
`

const ErrorTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 12px;
`

const ErrorMessage = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 32px;
  max-width: 500px;
  line-height: 1.5;
`

const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2563eb;
  }
`

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      return (
        <ErrorContainer>
          <ErrorIcon />
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>{this.state.error?.message || "An unexpected error occurred. Please try again."}</ErrorMessage>
          <RetryButton onClick={this.retry}>
            <RefreshCw size={16} />
            Try Again
          </RetryButton>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}
