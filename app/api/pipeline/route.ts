import { respond } from '../_lib/respond'
import { getPipeline } from '../_lib/queries'

export const GET = () => respond(getPipeline)
