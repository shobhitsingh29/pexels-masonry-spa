"use client"

import type React from "react"
import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import styled from "styled-components"
import { Search, X, Zap } from "lucide-react"

const SearchContainer = styled.div`
  position: relative;
  max-width: 500px;
  margin: 0 auto 24px;
  contain: layout style;
`

const SearchInput = styled.input.withConfig({
  shouldForwardProp: (prop) => prop !== "hasValue",
})<{ hasValue: boolean }>`
  width: 100%;
  padding: 14px 56px 14px 48px;
  border: 2px solid ${(props) => (props.hasValue ? "#3b82f6" : "#e5e7eb")};
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${(props) => (props.hasValue ? "#fafbff" : "white")};
  box-shadow: ${(props) => (props.hasValue ? "0 4px 12px rgba(59, 130, 246, 0.15)" : "0 1px 3px rgba(0, 0, 0, 0.1)")};

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    background: #fafbff;
  }

  &::placeholder {
    color: #9ca3af;
    transition: color 0.15s ease;
  }

  &:focus::placeholder {
    color: #6b7280;
  }
`

const IconContainer = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  transition: color 0.15s ease;
  
  ${SearchInput}:focus + & {
    color: #3b82f6;
  }
`

const SearchIcon = styled(Search).withConfig({
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive: boolean }>`
  width: 20px;
  height: 20px;
  transition: all 0.15s ease;
  opacity: ${(props) => (props.isActive ? 0 : 1)};
  transform: ${(props) => (props.isActive ? "scale(0.8)" : "scale(1)")};
`

const ZapIcon = styled(Zap).withConfig({
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  color: #f59e0b;
  transition: all 0.15s ease;
  opacity: ${(props) => (props.isActive ? 1 : 0)};
  transform: ${(props) => (props.isActive ? "scale(1)" : "scale(0.8)")};
`

const ClearButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%) scale(${(props) => (props.visible ? 1 : 0.8)});
  background: ${(props) => (props.visible ? "#f3f4f6" : "transparent")};
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${(props) => (props.visible ? 1 : 0)};
  pointer-events: ${(props) => (props.visible ? "auto" : "none")};
  
  &:hover {
    background-color: #e5e7eb;
    color: #374151;
    transform: translateY(-50%) scale(1.05);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`

const TypeIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "typing",
})<{ typing: boolean }>`
  position: absolute;
  right: 60px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #3b82f6;
  font-weight: 500;
  opacity: ${(props) => (props.typing ? 1 : 0)};
  transition: opacity 0.15s ease;
`

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search for photos...",
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange(newValue)

      // Show typing indicator
      setIsTyping(true)

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Hide typing indicator after user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 300)
    },
    [onChange],
  )

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSearch(value)
        inputRef.current?.blur()
      }

      if (e.key === "Escape") {
        onChange("")
        onSearch("")
        inputRef.current?.blur()
      }
    },
    [onSearch, value, onChange],
  )

  const handleClear = useCallback(() => {
    onChange("")
    onSearch("")
    inputRef.current?.focus()
  }, [onChange, onSearch])

  const showClearButton = useMemo(() => value.length > 0, [value])
  const isActive = useMemo(() => value.length > 0 || isFocused, [value, isFocused])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <SearchContainer>
      <SearchInput
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        hasValue={value.length > 0}
        autoComplete="off"
        spellCheck="false"
      />

      <IconContainer>
        <SearchIcon isActive={isActive} />
        <ZapIcon isActive={isActive} />
      </IconContainer>

      <TypeIndicator typing={isTyping && value.length > 0}>searching...</TypeIndicator>

      <ClearButton onClick={handleClear} visible={showClearButton} aria-label="Clear search">
        <X size={16} />
      </ClearButton>
    </SearchContainer>
  )
}
