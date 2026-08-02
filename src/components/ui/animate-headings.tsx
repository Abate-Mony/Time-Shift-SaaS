import { cn } from '@/lib/utils'
import { motion, type MotionProps, type MotionValue, type Transition, useScroll, useSpring, useTransform } from "framer-motion"
import React, { useRef } from 'react'
import { animateHeadingVariants, pageAnimationVariantsTransiton } from '../utils/framervariants.ts'


export interface IHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {

}
const Heading = ({ children, className, ...props }: IHeadingProps) => {
    return (
        <h1
            {...props}
            className={cn("text-xl  font-medium ", className)}
        >{children}</h1>
    )
}

export const VariantHeading = ({ children, className, ...props }: IHeadingProps & MotionProps) => {
    return (
        <motion.h1
            variants={animateHeadingVariants}
            initial="initial"
            whileInView="animate"
            transition={pageAnimationVariantsTransiton as Transition}
            {...props}
            className={cn("text-lg font-medium font-Marcellus+SC", className)}
        >{children}</motion.h1>
    )
}
const AnimatedCharacter = ({
    char,
    idx,
    total,
    scrollYProgress,
    startOpacity = 0.2

}: {
    char: string;
    idx: number;
    total: number;
    scrollYProgress: MotionValue<number>;
    startOpacity?: number;

}) => {
    const opacity = useTransform(
        scrollYProgress,
        [idx / total, (idx + 1) / total],
        [startOpacity, 1]
    );
    const smoothOpacity = useSpring(opacity, {
        stiffness: 200,
        damping: 30,
        mass: 0.5,
    });

    return (
        <motion.span style={{ opacity: smoothOpacity }}>
            {char}
        </motion.span>
    );
};
export const ScrollToViewHeading = ({
    text = "",
    className,
    start = 80,
    end = 20,
     startOpacity = 0.2

}: {
    text?: string;
    className?: string;
    start?: number;
    end?: number;
    startOpacity?: number;
}) => {
    const ref = useRef<HTMLHeadingElement>(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [(`start ${start}%`) as const, (`end ${end}%`) as const],
    });

    return (
        <motion.h1
            ref={ref}
            className={cn(
                "text-4xl font-bold",
                className
            )}
        >
            {text.split("").map((char, idx) => (
                <AnimatedCharacter
                    startOpacity={startOpacity}
                    key={idx}
                    char={char}
                    idx={idx}
                    total={text.length}
                    scrollYProgress={scrollYProgress}
                />
            ))}
        </motion.h1>
    );
};
export default Heading