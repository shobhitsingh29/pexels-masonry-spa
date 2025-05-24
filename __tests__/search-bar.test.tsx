import { render, screen, fireEvent, act } from "@testing-library/react"
import { SearchBar } from "@/components/search-bar"

describe("SearchBar", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
    onSearch: jest.fn(),
    placeholder: "Search photos...",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders search input", () => {
    render(<SearchBar {...defaultProps} />)
    const input = screen.getByPlaceholderText(defaultProps.placeholder)
    expect(input).toBeInTheDocument()
  })

  it("handles search input change", () => {
    render(<SearchBar {...defaultProps} />)
    const input = screen.getByPlaceholderText(defaultProps.placeholder)
    
    fireEvent.change(input, { target: { value: "nature" } })
    expect(defaultProps.onChange).toHaveBeenCalledWith("nature")
  })

  it("handles search submission", () => {
    render(<SearchBar {...defaultProps} value="nature" />)
    const form = screen.getByRole("search")
    
    fireEvent.submit(form)
    expect(defaultProps.onSearch).toHaveBeenCalledWith("nature")
  })

  it("handles empty search submission", () => {
    render(<SearchBar {...defaultProps} value="" />)
    const form = screen.getByRole("search")
    
    fireEvent.submit(form)
    expect(defaultProps.onSearch).not.toHaveBeenCalled()
  })

  it("handles keyboard navigation", () => {
    render(<SearchBar {...defaultProps} value="nature" />)
    const input = screen.getByPlaceholderText(defaultProps.placeholder)
    
    fireEvent.keyDown(input, { key: "Enter" })
    expect(defaultProps.onSearch).toHaveBeenCalledWith("nature")
  })

  it("handles clear button click", () => {
    render(<SearchBar {...defaultProps} value="nature" />)
    const clearButton = screen.getByRole("button", { name: /clear/i })
    fireEvent.click(clearButton)
    
    expect(defaultProps.onChange).toHaveBeenCalledWith("")
  })

  it("shows clear button only when input has value", () => {
    const { rerender } = render(<SearchBar {...defaultProps} value="" />)
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument()
    
    rerender(<SearchBar {...defaultProps} value="nature" />)
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument()
  })

  it("handles input focus and blur", () => {
    render(<SearchBar {...defaultProps} />)
    const input = screen.getByPlaceholderText(defaultProps.placeholder)
    
    fireEvent.focus(input)
    expect(input).toHaveFocus()
    
    fireEvent.blur(input)
    expect(input).not.toHaveFocus()
  })

  it("combines multiple custom props", () => {
    const props = {
      ...defaultProps,
      className: "test-search",
      style: { margin: "10px" },
    }
    
    render(<SearchBar {...props} />)
    const form = screen.getByRole("search")
    const input = screen.getByPlaceholderText(defaultProps.placeholder)
    
    expect(form).toHaveClass(props.className)
    expect(form).toHaveStyle(props.style)
  })
}) 