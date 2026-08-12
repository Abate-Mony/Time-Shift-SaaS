import type { ButtonHTMLAttributes, ReactNode } from "react"
import { useFilter } from "@/hooks/CustomLinkFilterHook"
import { useSearchParams } from "react-router"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

type FilterButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    name: string
    value?: string
    label?: ReactNode
    selectedClassName?: string;
    show?: boolean;
    animateClassName?: string;
    layoutId?: string;
}

const FilterButton = ({
    className,
    children, selectedClassName, animateClassName, show =false, layoutId = "this-is-id", onClick,
    ...props
}: FilterButtonProps) => {
    const { handleFilterChange } = useFilter()
    const [querySearch] = useSearchParams()
    const { value } = props
    const isSelected = value == querySearch.get(props.name)

    return (
        <Button
            onClick={(e) => {
                if (onClick) {
                    onClick(e);
                }

                handleFilterChange({ key: props.name, value })
            }}
            className={cn(` relative cursor-pointer bg-transparent text-black hover:bg-transparent!- focus:bg-transparent- group
      `,
                className,
                isSelected && "active-slide"
            )}
        >
        <span className="relative z-10">
                {children}
        </span>

            <AnimatePresence>
                {isSelected && show && (
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
                            "absolute left-0 right-0 bottom-0 z-9 h-px rounded-full w-full bg-black ",
                            animateClassName
                        )}
                    ></motion.span>
                )}
            </AnimatePresence>
        </Button>
    )
}

export default FilterButton