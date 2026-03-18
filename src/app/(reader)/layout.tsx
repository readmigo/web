export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`html, body { overflow: hidden !important; height: 100vh !important; }`}</style>
      <div className="h-screen w-screen overflow-hidden">
        {children}
      </div>
    </>
  );
}
