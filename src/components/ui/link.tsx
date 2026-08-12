import { NavLink, type NavLinkProps, type NavLinkRenderProps } from "react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type CustomClassName =
    | string
    | ((props: NavLinkRenderProps) => string);

export interface IFilterProps extends Omit<NavLinkProps, "className"> {
    className?: CustomClassName;
    selectedClassName?: string;
    pendingClassName?: string;
    show?: boolean;
    animateClassName?: string;
    layoutId?: string;
    /** Renders a subtle loading bar while this link's loader is running */
    showPendingBar?: boolean;
}

export default function CustomNavLink({
    className,
    children,
    selectedClassName,
    pendingClassName,
    show = false,
    showPendingBar = true,
    animateClassName,
    layoutId,
    ...props
}: IFilterProps) {
    return (
        <NavLink
            {...props}
            className={(navProps) =>
                cn(
                    "flex-none block relative w-full h-8 group isolate",
                    typeof className === "function"
                        ? className(navProps)
                        : className,
                    navProps.isActive && "slide-active",
                    navProps.isActive && selectedClassName,
                    navProps.isPending && "opacity-70 cursor-wait",
                    navProps.isPending && pendingClassName
                )
            }
        >
            {(navProps: NavLinkRenderProps) => (
                <>
                    {/* Active pill — no AnimatePresence so layoutId can morph
                        between links instead of cross-fading two elements */}
                    {navProps.isActive && show && (
                        <motion.span
                            layoutId={layoutId || "navActivePill"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 32,
                                mass: 0.8,
                            }}
                            className={cn(
                                "absolute left-0 right-0 bottom-0 h-px w-full bg-secondary-color rounded-lg z-0",
                                animateClassName
                            )}
                        />
                    )}

                    {/* Indeterminate bar while this route's loader runs */}
                    {navProps.isPending && showPendingBar && (
                        <motion.span
                            className="absolute bottom-0 left-0 h-px bg-current/40 rounded-full z-0"
                            initial={{ width: "0%", opacity: 0 }}
                            animate={{ width: ["0%", "100%"], opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                opacity: { duration: 0.2 },
                                width: {
                                    duration: 1.2,
                                    ease: "easeInOut",
                                    repeat: Infinity,
                                    repeatType: "loop",
                                },
                            }}
                        />
                    )}

                    <span className="relative z-10 block h-full">
                        {typeof children === "function" ? children(navProps) : children}
                    </span>
                </>
            )}
        </NavLink>
    );
};

// export default CustomNavLink;