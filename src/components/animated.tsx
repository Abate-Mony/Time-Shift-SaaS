import { cn } from "@/lib/utils";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import React, { useEffect, useRef, useState } from 'react';
import type { IFilterProps } from "./ui/link";
import CustomNavLink from "./ui/link";
type iWord = {
    text: string;
    className?: string;
}[];
const qoute = {
    initial: {
        opacity: 1
    },
    animate: {
        opacity: 1,
        transition: {
            delay: 0.5,
            staggerChildren: 0.08
        }

    }
}

const singleword = {
    initial: {
        y: 50,
        x: -10,
        opacity: 0
    },
    animate: {
        y: 0, opacity: 1, x: 0
        , transition: {
            duration: 1
        }
    }
}

export const SplitText = ({ text }: { text: string }) => {
    return text?.split(" ").map((word, index) => (
        <motion.span

            variants={singleword}
            className='inline-block'
            key={index + word}
        >{word}&nbsp;</motion.span>
    ))
}
interface iAnimatedProps {
    className?: string,
    inView?: boolean;
    amount?: number;
    text: string,
    words?: iWord,
    once?: boolean

}
export const AnimatedText = ({
    text,
    className = "",
    inView,
    amount, once = true }: iAnimatedProps) => {

    return (
        <div
            className={cn(` w-full  mx-auto  py-2 flex items-center justify-center text-center 
            overflow-hidden`,)}
        >
            <motion.h1
                variants={qoute}
                initial="initial"
                animate={inView ? false : "animate"}
                whileInView={inView ? "animate" : ""}
                viewport={{ once, amount: amount ? amount : 0.2 }}
                className={cn(`break-words
                inline-block w-full text-dark font-black  capitalize
                text-6xl`, className)}>

                <SplitText text={text} />


            </motion.h1>


        </div>
    )
}
interface iAnimateError {
    error: any,
    errorMessage: string,
    className?: string;
    duration?: number
}
export function AnimateError({
    error,
    errorMessage,
    className, duration }: iAnimateError) {
    return (

        <div className={
            cn(`mb-1    flex max-w-sm mx-auto
        items-center
        justify-between
        text-xs font-medium
        md:text-sm
        text-orange-600`,
                className)}>
            <motion.h1
                animate={{
                    opacity: error ? 1 : 0,
                    x: error ? [-50, 50, 0, -50, 50, 0] : undefined

                }}
                transition={{ duration: duration || 0.3 }}
                className="w-fit flex-none mx-auto tracking-[0.2rem]  mt-0.5  text-center ">  {errorMessage}</motion.h1>
        </div>

    )
}
const _singleword = {
    initial: {
        // y: 50,
        x: 20,
        opacity: 0.1,
        // scale: 0.1
    },
    animate: {
        // y: 0,
        opacity: 1,
        x: 0,
        scale: 1
        , transition: {
            duration: 0.8,
        }
    }
}

const SplitSlideText = ({ text
    , words
}: { text: string, words?: iWord }) => {
    if (words?.length) {
        return words.map((word) => word).map((singleword_) => {
            console.log("single word", singleword_)
            const _word = singleword_.text.split("").map((word, index) => (
                <motion.span
                    variants={_singleword}
                    className={cn('inline-block break-normal',
                        singleword_.className
                    )}
                    key={index + word}
                >{word}</motion.span>))
            return <div className='inline-block'>{_word} &nbsp;</div>

        })

    }
    return text?.split(" ").map((word) => word).map((singleword_) => {
        const _word = singleword_.split("").map((word, index) => (
            <motion.span
                variants={_singleword}
                className='inline-block break-normal'
                key={index + word}
            >{word}</motion.span>))

        return <div className='inline-block'>{_word}&nbsp;</div>

    })
}
export const AnimatedSlideText = ({
    text,
    className = "",
    inView,
    amount,
    words, once = true }: iAnimatedProps) => {
    return (
        <div
            className={cn(` w-full  mx-auto  py-2 flex items-center justify-center text-center 
            overflow-hidden`,)}
        >
            <motion.h1
                variants={qoute}
                initial="initial"
                animate={inView ? false : "animate"}
                whileInView={inView ? "animate" : ""}
                viewport={{ once, amount: amount ? amount : 0.2 }}
                className={cn(`break-words
                inline-block w-full text-dark font-black  capitalize 
                text-6xl`, className)}>

                <SplitSlideText text={text} words={words} />
            </motion.h1>


        </div>
    )
}
export const AnimatedNumber = ({ value, className }: {
    value: number,
    className?: string
}) => {
    const ref = React.useRef<any>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        duration: 3000,
    })
    const isInView = useInView(ref, {
        once: false,
        amount: 0.8

    });
    React.useEffect(() => {
        if (isInView) {
            motionValue.set(value)
        }
    }, [isInView, value, motionValue])
    React.useEffect(() => {
        springValue.on('change', (latest) => {
            if (ref.current && Number(latest.toFixed(0)) <= value) {
                ref.current.textContent = latest.toFixed(0) || 0
            }
        })

    }, [springValue, value])

    return (
        <motion.span ref={ref}
            className={cn('',// define baseclasses here

                className)}
        >
        </motion.span>
    )
}
type SpotlightProps = {
    className?: string;
    fill?: string;
};

export const Spotlight = ({ className, fill }: SpotlightProps) => {
    return (
        <svg
            className={cn(
                "animate-spotlight pointer-events-none absolute z-[1]  h-[169%] w-[138%] lg:w-[84%] opacity-0",
                className
            )}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 3787 2842"
            fill="none"
        >
            <g filter="url(#filter)">
                <ellipse
                    cx="1924.71"
                    cy="273.501"
                    rx="1924.71"
                    ry="273.501"
                    transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
                    fill={fill || "white"}
                    fillOpacity="0.21"
                ></ellipse>
            </g>
            <defs>
                <filter
                    id="filter"
                    x="0.860352"
                    y="0.838989"
                    width="3785.16"
                    height="2840.26"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundimgFix"></feFlood>
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundimgFix"
                        result="shape"
                    ></feBlend>
                    <feGaussianBlur
                        stdDeviation="151"
                        result="effect1_foregroundBlur_1065_8"
                    ></feGaussianBlur>
                </filter>
            </defs>
        </svg>
    );
};

// import { useRef, useEffect, useState } from "react";
// import { motion } from "framer-motion";


export const AnimateSomething = () => {
    const timerRef = useRef<any>(null);
    const TIME_OUT = 400; // Animation interval in ms
    const words = ["good", "nice", "better"];

    const longestWord = words.reduce((longest, current) => {
        return current.length > longest.length ? current : longest;
    }, "");

    const [currentWordIdx, setCurrentWordIdx] = useState(0);
    const [isReversing, setIsReversing] = useState(false); // Track direction

    const updateIndex = () => {
        setCurrentWordIdx((prevIdx) => {
            if (!isReversing && prevIdx + 1 === words.length) {
                setIsReversing(true); // Start reversing
                return prevIdx - 1; // Move to the previous index
            } else if (isReversing && prevIdx === 0) {
                setIsReversing(false); // Start incrementing again
                return prevIdx + 1; // Move to the next index
            }
            return isReversing ? prevIdx - 1 : prevIdx + 1;
        });
    };

    useEffect(() => {
        timerRef.current = setInterval(updateIndex, TIME_OUT);
        return () => clearInterval(timerRef.current); // Cleanup on unmount
    }, [isReversing, words]);

    return (
        <div className="relative uppercase font-black text-primary-color inline-block w-fit px-4 overflow-hidden bg-orange-50-">
            {/* Hidden span to ensure container size matches longest word */}
            <span className="invisible inline-block">{longestWord}</span>

            <motion.div
                className="absolute  w-full h-full top-0 left-0"
                animate={{
                    y: `-${currentWordIdx * 100}%`,
                    opacity: 1, // Ensure opacity reaches 1
                }}
                initial={{ opacity: 0 }} // Start with 0 opacity for fade-in effect
                transition={{
                    y: { duration: 0.2, ease: "easeInOut" }, // Smooth vertical transition
                    opacity: { duration: 0.5 }, // Separate transition for opacity
                }}
            >
                {words.map((word, index) => (
                    <motion.span
                        key={index}
                        className="flex  items-center justify-center w-full h-full"
                    >
                        {word}
                    </motion.span>
                ))}
            </motion.div>
        </div>
    );
};
interface AnimatedLinksProps extends IFilterProps {
    className?: string,
    secondTextClassName?: string
    selectedClassName?: string,
    children?: React.ReactNode
}
export const DropAnimation = ({
    name,
    className,
}: {
    name: string,
    className?: string
}) => {
    const formatStr = name.split("");

    return (
        <span>
            {formatStr.map((chr, idx) => (
                <span
                    style={{
                        transitionDelay: `${idx * 80}ms`
                    }}
                    className={cn(
                        `inline-block
                        transition-all duration-500
                        group-hover/animate:text-orange-400
                        group-hover/animate:-translate-y-1
                        group-hover/animate:translate-x-1
                        group-hover/animate:scale-110`,
                        className
                    )}
                    key={idx}
                >
                    {chr === " " ? "\u00A0" : chr}
                </span>
            ))}
        </span>
    );
}
export const AnimatedLinks = ({ className, children, secondTextClassName, ...props }: AnimatedLinksProps) => {
    return (

        <CustomNavLink
            show
            className={cn("relative text-start  bg-white- p-0 bg-black- font-poppins overflow-hidden group",
                className
            )}
            {
            ...props

            }>

            <span
                className={cn(`absolute block- left-0- right-0
          group-hover:!bottom-0
          flex items-center -translate-x-1/2 left-1/2
          transition-all duration-500
          text-center  justify-center
        -bottom-[calc(100%)] size-full  text-secondary-color `,
                    "group-slide-active:text-blue-600",


                )}>
                {children}
            </span>

            <span

                className={cn(`block group-hover:-translate-y-10
                delay-100
                transition-all duration-500
                     w-full`, secondTextClassName,
                    "group-slide-active:text-blue-600",
                )}
            >
                {children}

            </span>

        </CustomNavLink>
    )
}






// export default AnimatedText