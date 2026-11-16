import { AccessTokenPayload } from "../utils/token.js"

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload
    }
  }
}

export {}

