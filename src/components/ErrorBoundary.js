'use client'

import { Component } from 'react'
import Button from '@/components/ui/Button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 p-6 text-center">
          <div className="text-5xl">⚠️</div>
          <div>
            <h2 className="font-display text-2xl font-bold text-ink mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-ink-3 max-w-sm leading-relaxed">
              An unexpected error occurred. Try refreshing the page. If the problem
              persists, contact support.
            </p>
            {this.state.error?.message && (
              <p className="mt-3 text-xs text-ink-4 font-mono bg-surface border border-border rounded-xl px-4 py-2 max-w-sm mx-auto text-left">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}