import { Component } from 'react'

/**
 * Catches render/runtime errors (and failed lazy-chunk loads) in its subtree
 * so one broken piece — e.g. the WebGL scene on a device without usable
 * WebGL — can never blank the whole page. Renders `fallback` instead.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Surface it for debugging without crashing the app.
    console.error('[ErrorBoundary]', this.props.label || '', error, info)
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
