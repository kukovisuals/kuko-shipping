// Shared by every route: JSON on success, { error } with the right status on failure.

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function respond(build: () => Promise<unknown>): Promise<Response> {
  try {
    return Response.json(await build())
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status })
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
