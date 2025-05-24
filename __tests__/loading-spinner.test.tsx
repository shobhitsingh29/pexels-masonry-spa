import { render, screen } from "@testing-library/react"
import { LoadingSpinner } from "@/components/loading-spinner"

describe("LoadingSpinner", () => {
  it("renders with default props", () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByTestId("loading-spinner")
    expect(spinner).toBeInTheDocument()
  })

  it("applies custom size", () => {
    const size = 48
    render(<LoadingSpinner size={size} />)
    const spinner = screen.getByTestId("loading-spinner")
    expect(spinner).toHaveStyle({ width: `${size}px`, height: `${size}px` })
  })

  it("applies custom color", () => {
    const color = "#ff0000"
    render(<LoadingSpinner color={color} />)
    const spinner = screen.getByTestId("loading-spinner")
    expect(spinner).toHaveStyle({ borderColor: `${color} transparent transparent transparent` })
  })

  it("applies custom thickness", () => {
    const thickness = 4
    render(<LoadingSpinner thickness={thickness} />)
    const spinner = screen.getByTestId("loading-spinner")
    expect(spinner).toHaveStyle({ borderWidth: `${thickness}px` })
  })

  it("applies custom speed", () => {
    const speed = 2
    render(<LoadingSpinner speed={speed} />)
    const spinner = screen.getByTestId("loading-spinner")
    expect(spinner).toHaveStyle({ animationDuration: `${speed}s` })
  })

  it("applies custom className", () => {
    const className = "custom-spinner"
    render(<LoadingSpinner className={className} />)
    const spinner = screen.getByTestId("loading-spinner")
    expect(spinner).toHaveClass(className)
  })

  it("applies custom style", () => {
    const style = { margin: "20px" }
    render(<LoadingSpinner style={style} />)
    const spinner = screen.getByTestId("loading-spinner")
    expect(spinner).toHaveStyle(style)
  })

  it("combines multiple custom props", () => {
    const props = {
      size: 32,
      color: "#00ff00",
      thickness: 3,
      speed: 1.5,
      className: "test-spinner",
      style: { margin: "10px" },
    }
    
    render(<LoadingSpinner {...props} />)
    const spinner = screen.getByTestId("loading-spinner")
    
    expect(spinner).toHaveStyle({
      width: `${props.size}px`,
      height: `${props.size}px`,
      borderColor: `${props.color} transparent transparent transparent`,
      borderWidth: `${props.thickness}px`,
      animationDuration: `${props.speed}s`,
      margin: props.style.margin,
    })
    expect(spinner).toHaveClass(props.className)
  })
}) 