import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  content: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, content }) => {
	return (
		<Link href="/practice" className="block h-full">
			<Card className="h-full min-h-[160px] hover:shadow-lg transition-shadow cursor-pointer">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						{content}
					</p>
				</CardContent>
			</Card>
		</Link>
	);
};
