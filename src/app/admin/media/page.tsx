"use client"

import MediaManager from "@/components/admin/media/MediaManager"
import { MediaProvider } from "@/lib/contexts/media-context"

export default function MediaManagerPage() {
    // Wrap MediaManager with our MediaProvider
    return (
      <MediaProvider pollingInterval={30000}>
          <MediaManager />
      </MediaProvider>
    )
}
