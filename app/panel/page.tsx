import { ColaboradoresClient } from '@/components/panel/colaboradores-client'
import { listColaboradores, listCompanies } from '@/lib/panel/server'

export const dynamic = 'force-dynamic'

export default async function ColaboradoresPage() {
  const [colaboradores, empresas] = await Promise.all([
    listColaboradores(),
    listCompanies(),
  ])

  return (
    <ColaboradoresClient colaboradores={colaboradores} empresas={empresas} />
  )
}
