import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "./ui";
import { Button } from "./ui/button";

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
}

export default function PasswordInput({
    value,
    onChange,
    placeholder,
    error,
}: Props) {
    const [visible, setVisible] =
        useState(false);

    return (
        <div className="relative">
            <Input
                type={
                    visible
                        ? "text"
                        : "password"
                }
                value={value}
                placeholder={
                    placeholder ??
                    "••••••••"
                }
                onChange={(e) =>
                    onChange(e.target.value)
                }
                className={`
                    w-full h-11 px-4 pr-11
                    border rounded-xl
                    text-sm text-slate-800
                    bg-white
                    placeholder:text-slate-400
                    focus:outline-none
                    focus:ring-2
                    transition-all
                    ${
                        error
                            ? "border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40"
                    }
                `}
            />

            <Button
                type="button"
                onClick={() =>
                    setVisible((v) => !v)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={
                    visible
                        ? "Hide password"
                        : "Show password"
                }
            >
                {visible ? (
                    <EyeOff size={15} />
                ) : (
                    <Eye size={15} />
                )}
            </Button>
        </div>
    );
}