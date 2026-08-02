import React from "react";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, description, actions, breadcrumbs }) {
    return (
        <div className="mb-6 animate-fade-in">
            {breadcrumbs && (
                <nav className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    {breadcrumbs.map((b, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <span className="text-border">/</span>}
                            <span className={cn(i === breadcrumbs.length - 1 && "text-foreground font-medium")}>{b}</span>
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}