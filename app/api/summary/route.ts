import { respond } from '../_lib/respond'
import { getSummary } from '../_lib/queries'

export const GET = () => respond(getSummary)
