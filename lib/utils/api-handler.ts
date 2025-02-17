import { NextResponse } from "next/server"
import { handleError } from "./error-handler"

type ApiHandler = (req: Request) => Promise<Response>

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error(error)
      handleError(error)
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      )
    }
  }
} 