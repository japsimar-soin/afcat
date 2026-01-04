import { Navbar } from "@/components/navbar";

export default function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen">
			<Navbar />
			{children}
		</div>
	);
}
