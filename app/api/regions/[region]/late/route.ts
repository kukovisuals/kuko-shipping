import { parseRegion } from '../../../../../lib/regions'
import { getLateOrders, parseLimit, DEFAULT_LATE_LIMIT } from '../../../_lib/queries'
import { HttpError, respond } from '../../../_lib/respond'

export async function GET(request: Request, { params }: { params: Promise<{ region: string }> }) {
  return respond(async () => {
    const { region: raw } = await params
    const region = parseRegion(raw)
    if (!region) throw new HttpError(400, `Unknown region "${raw}". Use WEST, MIDWEST, NE or SOUTH.`)

    const limit = parseLimit(new URL(request.url).searchParams.get('limit'))
    if (limit === null) throw new HttpError(400, `limit must be a whole number from 1 to 100 (default ${DEFAULT_LATE_LIMIT}).`)

    return getLateOrders(region, limit)
  })
}
