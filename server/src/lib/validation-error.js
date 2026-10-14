import mongoose from 'mongoose'

/**
 * Turn { path: message } into a Mongoose ValidationError.
 * AdminJS shows these messages next to the matching form fields.
 */
export function toValidationError(errors) {
  const err = new mongoose.Error.ValidationError()
  for (const [path, message] of Object.entries(errors)) {
    err.addError(path, new mongoose.Error.ValidatorError({ path, message }))
  }
  return err
}
