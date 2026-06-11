import { getFixtures } from '@/lib/mundial2026/api'
import MundialClient from './components/MundialClient'

export const dynamic = 'force-dynamic'

export default async function Mundial2026Page() {
  const data = await getFixtures()
  return <MundialClient initialData={data} />
}
