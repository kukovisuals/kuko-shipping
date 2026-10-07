import { respond } from '../_lib/respond'
import { getLanes } from '../_lib/queries'

export const GET = () => respond(getLanes)
