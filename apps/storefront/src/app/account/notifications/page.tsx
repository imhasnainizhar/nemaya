import { getInbox, getNotificationPreferences } from "@/lib/data"
import { PushToggle } from "@/components/push-toggle"
import { Inbox } from "./inbox"
import { Preferences } from "./preferences"

export default async function NotificationsPage() {
  const [inbox, prefs] = await Promise.all([getInbox(50), getNotificationPreferences()])
  return (
    <div className="space-y-6">
      <section className="card p-6 sm:p-8">
        <h2 className="font-display text-3xl">Push notifications</h2>
        <p className="mt-1 mb-5 text-sm text-stone">
          Get order updates, security alerts and drops on this device — even when Nemaya isn't open.
        </p>
        <PushToggle />
      </section>

      <Inbox initial={inbox.messages} unread={inbox.unread_count} />

      {prefs && <Preferences initial={prefs.preferences} optional={prefs.optional_types} />}
    </div>
  )
}
