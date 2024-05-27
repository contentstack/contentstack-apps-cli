export function formatErrors(errors: any): string {
  let errorMessage: string = "";
  if (errors.message) {
    errorMessage = errors.message;
  }
  return errorMessage;
}
