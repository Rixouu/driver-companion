"use client"

import { useState, useCallback } from "react"
import { handleError } from "@/lib/utils/error-handler"

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: unknown | null
}

type AsyncFn<T, Args extends any[]> = (...args: Args) => Promise<T>

/**
 * A hook for handling async operations with built-in loading, error states, and error handling
 */
export function useAsync<T, Args extends any[] = []>(
  asyncFunction: AsyncFn<T, Args>,
  immediate = false,
  initialArgs?: Args
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
  })

  const execute = useCallback(
    async (...args: Args) => {
      setState(prevState => ({
        ...prevState,
        isLoading: true,
        error: null,
      }))

      try {
        const data = await asyncFunction(...args)
        setState(prevState => ({
          ...prevState,
          data,
          isLoading: false,
          error: null,
        }))
        return { data, error: null }
      } catch (error) {
        // Use our centralized error handling
        const handledError = handleError(error)
        
        setState(prevState => ({
          ...prevState,
          data: null,
          isLoading: false,
          error: handledError,
        }))
        return { data: null, error: handledError }
      }
    },
    [asyncFunction]
  )

  // If immediate is true, execute the function right away
  useState(() => {
    if (immediate && initialArgs) {
      execute(...initialArgs)
    }
  })

  return {
    ...state,
    execute,
    // Helper method to reset the state
    reset: useCallback(() => {
      setState({
        data: null,
        isLoading: false,
        error: null,
      })
    }, []),
  }
}

/**
 * A simpler hook for handling async operations with automatic error handling
 */
export function useSafeAsync<T>(
  asyncFn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: unknown) => void
    customErrorMessage?: string
  }
) {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await asyncFn()
      setData(result)
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      // Handle error with custom message if provided
      handleError(
        options?.customErrorMessage
          ? new Error(options.customErrorMessage, { cause: error })
          : error
      )
      options?.onError?.(error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [asyncFn, options])

  return { execute, isLoading, data }
} 