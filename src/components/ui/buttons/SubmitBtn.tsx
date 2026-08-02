import { useNavigation } from 'react-router'
import type { ReactNode } from 'react'
import type { ButtonProps } from 'node_modules/@base-ui/react/button/Button.d.mts'
import { Button } from '../button'
import { cn } from '@/lib/utils'
interface iSubmitProps extends ButtonProps {
    children: ReactNode,
    isError?: boolean,
    submittingText?: string | ReactNode,
    isLoading?:boolean,
    refE?:any
}
const SubmitBtn = ({
    children,
    className,
    submittingText,isLoading,
    refE,
    ...props
}: iSubmitProps) => {
    const navigation = useNavigation()
    const isSubmitting = isLoading ?? navigation.state == "submitting" 
    return (
        <Button
        ref={refE}
            disabled={isSubmitting}
            className={cn(`
            disabled:bg-red-800
            `, className)}
            {...props}
        >
            {isSubmitting ? submittingText || "loading ..." : children}
        </Button>
    )
}

export default SubmitBtn