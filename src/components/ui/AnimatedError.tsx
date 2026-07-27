import { AnimatePresence, motion, useInView, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils.js'
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
            duration: 0.5
        }
    }
}
const _singleword = {
    initial: {
        // y: 50,
        x: 40,
        opacity: 0
    },
    animate: {
        // y: 0,
        opacity: 1, x: 0
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
export const SplitSlideText = ({ text }: { text: string }) => {
    return text?.split(" ").map((word) => word).map((singleword_) => {
        const _word = singleword_.split("").map((word, index) => (
            <motion.span
                variants={_singleword}
                className='inline-block'
                key={index + word}
            >{word}</motion.span>))

        return <>{_word}&nbsp;</>

    })
}
interface iAnimatedProps {
    className?: string,
    inView?: boolean;
    amount?: number;
    text: string
}
export const AnimatedText = ({
    text,
    className = "",
    inView,
    amount }: iAnimatedProps) => {
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
                viewport={{ once: true, amount: amount ? amount : 0.2 }}
                className={cn(`wrap-break-word
                inline-block w-full text-dark font-black  capitalize
                text-6xl`, className)}>
                <SplitText text={text} />
            </motion.h1>


        </div>
    )
}
export const AnimatedSlideText = ({
    text,
    className = "",
    inView,
    amount }: iAnimatedProps) => {
    return (
        <div
            className={cn(` w-full  mx-auto font-Marcellus+SC  py-2 flex items-center justify-center text-center 
            overflow-hidden`,)}
        >
            <motion.h1
                variants={qoute}
                initial="initial"
                animate={inView ? false : "animate"}
                whileInView={inView ? "animate" : ""}
                viewport={{ once: true, amount: amount ? amount : 0.2 }}
                className={cn(`break-words
                inline-block w-full text-dark font-black  capitalize
                text-6xl`, className)}>
                <SplitSlideText text={text} />
            </motion.h1>


        </div>
    )
}
interface iAnimateError {
    errorMessage: string | any,
    className?: string;
    duration?: number
}
export function AnimateError({
    errorMessage,
    className,
    duration }: iAnimateError) {
    return (

        <AnimatePresence>

            {errorMessage &&
                <>
                    <div className={
                        cn(`mb-6 flex max-w-sm mx-auto overflow-hidden
        items-center
        justify-between
        text-xs font-medium
        md:text-sm
        text-orange-600`,
                            className)}>
                        <motion.h1
                            key={errorMessage}
                            initial={
                                {
                                    opacity: 0,
                                    y: 5
                                }
                            }
                            animate={{
                                x: [-50, 50, 0, -50, 50, 0], opacity: 1, y: 0

                            }}
                            exit={{
                                opacity: 0,
                                y:20,
                                transition: {
                                    duration: 0.3
                                }
                            }}
                            transition={{ duration: duration || 0.3 }}
                            className="w-fit flex-none mx-auto tracking-[0.2rem]  mt-0.5  text-center ">  {errorMessage}</motion.h1>
                    </div>
                </>
            }

        </AnimatePresence>

    )
}
export const AnimatedNumber = ({ value, className }: {
    value: number,
    className?: string
}) => {
    const ref = useRef<any>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        duration: 3000,
    })
    const isInView = useInView(ref, {
        once: false,
        amount: 0.8

    });
    useEffect(() => {
        if (isInView) {
            motionValue.set(value)
        }
    }, [isInView, value, motionValue])
    useEffect(() => {
        springValue.on('change', (latest) => {
            if (ref.current && parseInt(latest?.toFixed(0)) <= value) {
                ref.current.textContent = latest.toFixed(0)
            }
        })

    }, [springValue, value])

    return (
        <motion.span ref={ref}
            className={cn('tabular-nums',// define baseclasses here

                className)}
        >
        </motion.span>
    )
}
