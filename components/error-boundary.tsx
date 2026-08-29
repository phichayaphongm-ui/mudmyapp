'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                เกิดข้อผิดพลาด
              </h1>
              <p className="text-muted-foreground">
                ระบบเกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้ง
              </p>
              {this.state.error?.message && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    รายละเอียดข้อผิดพลาด
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <Button
              onClick={this.handleReset}
              className="w-full gap-2"
              size="lg"
            >
              <RefreshCcw className="w-4 h-4" />
              รีเฟรชหน้าเว็บ
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
