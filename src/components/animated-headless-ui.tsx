import { cn } from '@/lib/utils';
import { AnimatePresence, motion, type MotionProps } from 'framer-motion';
import React from 'react';

interface Props extends MotionProps {
    className?: string;
    hoverIndex: number | null;
    setHoverIndex: any;
    index: number;
    children: React.ReactNode;
    animatedClassName?: string;
    layoutId?: string;
    activeIndex?: number;
}

function AnimatedHeadLessUi({
    className,
    hoverIndex,
    setHoverIndex,
    index,
    children,
    animatedClassName,
    layoutId,
    activeIndex,
    ...props
}: Props) {
    const isActive = activeIndex === index || hoverIndex === index

    return (
        <div
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            className={cn(
                'flex-none relative block isolate transition-all duration-300',
                className,
                activeIndex !== undefined ? 'pointer-events-none' : 'pointer-events-auto'
            )}
        >
            <AnimatePresence>
                {isActive && (
                    <motion.span
                        {...props}
                        layoutId={layoutId || "hoverBackground"}
                        animate={{
                            opacity: 1,
                            transition: { duration: 0.15 },
                        }}
                        exit={{
                            opacity: 0,
                            transition: { duration: 0.15, delay: 0.2 },
                        }}
                        className={cn(
                            'absolute inset-0 size-full block z-0',
                            animatedClassName
                        )}
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}

export default AnimatedHeadLessUi