export function base64ToAttachment(
  base64: string,
  filename: string
) {
  return {
    filename,
    content: Buffer.from(base64, 'base64'),
  };
}
