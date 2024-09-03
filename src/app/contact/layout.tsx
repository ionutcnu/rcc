import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Red Cat Cuasar",
  description: "Red Cat Cuasar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
