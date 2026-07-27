import { NavLink,type NavLinkProps,type NavLinkRenderProps } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface IFilterProps extends NavLinkProps {
    selectedClassName?: string;
    show?: boolean;
    animateClassName?: string;
    replace?: boolean;
    end?: boolean;
    layoutId?: string;
}

const CustomNavLink = ({
    className,
    children,
    selectedClassName,
    show=false,
    animateClassName,
    layoutId,
    ...props
}: IFilterProps) => {
    return (
        <NavLink
            {...props}
            className={({ isActive }) =>
                cn(
                    "flex-none block relative w-full h-8",
                    className,
                    isActive && "slide-active",
                    isActive && selectedClassName
                )
            }
        >
            {(navProps: NavLinkRenderProps) => (
                <>
                    {/* Render children dynamically based on props */}
                    {typeof children === "function" ? children(navProps) : children}

                    <AnimatePresence>
                        {navProps.isActive && show && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    transition: { duration: 0.15 },
                                }}
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.15, delay: 0.2 },
                                }}
                                layoutId={layoutId || "hoverBackground"}
                                className={cn(
                                    "absolute left-0 right-0 bottom-0 h-[1px] w-full bg-secondary-color rounded-lg",
                                    animateClassName
                                )}
                            ></motion.span>
                        )}
                    </AnimatePresence>
                </>
            )}
        </NavLink>
    );
};

export default CustomNavLink;
