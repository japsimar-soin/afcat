"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

const ErrorPage = () => {
    return ( 
        <div className="h-screen flex flex-col items-center gap-y-4 justify-center">
            <AlertTriangle className="size-14 text-muted-foreground"/>
            <p className="text-lg">
                Something went wrong
            </p>
            <Button variant="secondary" size="sm" >
                <Link href="/">Go back home</Link>
            </Button>
        </div>
     );
}
 
export default ErrorPage;