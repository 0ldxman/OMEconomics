export default function DatabaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col h-full">
      {children}
    </div>
  )
}
