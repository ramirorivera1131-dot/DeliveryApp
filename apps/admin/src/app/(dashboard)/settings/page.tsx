import { createAdminClient } from '@/lib/supabase/admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DeliveryTiersEditor } from '@/components/settings/DeliveryTiersEditor'
import { PlansEditor } from '@/components/settings/PlansEditor'
import { formatCurrency } from '@/lib/utils'
import { Settings, Truck, CreditCard, Users, Percent } from 'lucide-react'

async function getSettingsData() {
  const supabase = createAdminClient()
  const [{ data: tiers }, { data: plans }, { data: admins }] = await Promise.all([
    supabase.from('delivery_fee_tiers').select('*').order('min_km'),
    supabase.from('subscription_plans').select('*').order('price_per_branch_usd'),
    supabase.from('admin_users').select('id, full_name, email, role, is_active, last_login_at').order('created_at'),
  ])
  return { tiers: tiers ?? [], plans: plans ?? [], admins: admins ?? [] }
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', ops_manager: 'Operaciones',
  support: 'Soporte', accountant: 'Contabilidad', viewer: 'Visualizador',
}

export default async function SettingsPage() {
  const { tiers, plans, admins } = await getSettingsData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Parámetros del sistema y configuración de la plataforma</p>
      </div>

      <Tabs defaultValue="delivery">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="delivery" className="gap-2"><Truck className="h-3.5 w-3.5" /> Tarifas de envío</TabsTrigger>
          <TabsTrigger value="plans" className="gap-2"><CreditCard className="h-3.5 w-3.5" /> Planes</TabsTrigger>
          <TabsTrigger value="commission" className="gap-2"><Percent className="h-3.5 w-3.5" /> Comisiones</TabsTrigger>
          <TabsTrigger value="team" className="gap-2"><Users className="h-3.5 w-3.5" /> Equipo admin</TabsTrigger>
        </TabsList>

        {/* Delivery tiers */}
        <TabsContent value="delivery" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tarifas de envío por distancia</CardTitle>
              <CardDescription>Define cuánto se cobra por cada rango de distancia en km</CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryTiersEditor tiers={tiers} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans */}
        <TabsContent value="plans" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planes de suscripción</CardTitle>
              <CardDescription>Gestiona los planes disponibles para restaurantes</CardDescription>
            </CardHeader>
            <CardContent>
              <PlansEditor plans={plans} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission */}
        <TabsContent value="commission" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modelo de comisiones</CardTitle>
              <CardDescription>Distribución actual de los ingresos por envío</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Plataforma',   pct: '15%', desc: 'De la tarifa de envío',        color: 'text-primary' },
                  { label: 'Repartidor',   pct: '85%', desc: 'De la tarifa de envío',        color: 'text-green-600' },
                  { label: 'Restaurante',  pct: '100%', desc: 'Del subtotal de productos',   color: 'text-blue-600' },
                ].map(c => (
                  <div key={c.label} className="rounded-lg bg-muted p-4 text-center">
                    <p className={`text-3xl font-bold ${c.color}`}>{c.pct}</p>
                    <p className="font-semibold mt-1">{c.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Los porcentajes de repartidor se pueden ajustar individualmente desde el perfil de cada repartidor.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipo administrativo</CardTitle>
              <CardDescription>Usuarios con acceso al panel de administración</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Administrador</TableHead><TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead><TableHead>Último acceso</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {admins.map((admin: { id: string; full_name: string; email: string; role: string; is_active: boolean; last_login_at: string | null }) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{admin.full_name}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                          {ROLE_LABELS[admin.role] ?? admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.is_active ? 'success' : 'destructive'}>
                          {admin.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {admin.last_login_at ? new Date(admin.last_login_at).toLocaleDateString('es') : 'Nunca'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
