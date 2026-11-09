import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminCustomer } from "@medusajs/framework/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { fmtDate, useApi } from "../lib/api"

const CustomerProfileWidget = ({ data: customer }: DetailWidgetProps<AdminCustomer>) => {
  const { data } = useApi<{ profile: any; devices: any[]; push_subscriptions: number }>(
    `/admin/nemaya/customers/${customer.id}/profile`
  )
  const p = data?.profile
  return (
    <Container className="flex flex-col gap-4 px-6 py-4">
      <Heading level="h2">Nemaya profile</Heading>
      {!p ? (
        <Text size="small" className="text-ui-fg-subtle">No profile yet (customer hasn't finished sign-up).</Text>
      ) : (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full" dangerouslySetInnerHTML={{ __html: p.avatar_svg }} />
          <div>
            <Text weight="plus">@{p.username}</Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              Username changes left: {p.quota.remaining}/{p.quota.limit} (30 days)
            </Text>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Text size="small" weight="plus">Devices</Text>
        {(data?.devices ?? []).map((d) => (
          <Text key={d.id} size="xsmall" className="text-ui-fg-subtle">{d.label} · {d.last_ip ?? "—"} · {fmtDate(d.last_seen_at)}</Text>
        ))}
        {!data?.devices?.length && <Text size="xsmall" className="text-ui-fg-subtle">No sign-ins recorded.</Text>}
      </div>
      <Badge size="2xsmall" className="w-fit">Web push devices: {data?.push_subscriptions ?? 0}</Badge>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "customer.details.side.before" })

export default CustomerProfileWidget
