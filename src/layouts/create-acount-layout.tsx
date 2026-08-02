import { VariantHeading } from "@/components/ui/animate-headings"
import CustomNavLink from "@/components/ui/link"
import { Scrollable } from "@/components/ui/scrollable"
import { useMemo } from "react"
import { Outlet } from "react-router"
export function JoinUsLayout() {

    // main logic here 
    const pages = useMemo(() => {

        return ([
            {
                page: "",
                name: "User Information"
            },
            {
                page: "preview",
                name: "Preview information"
            },
            {
                page: "company-information",
                name: "Company Information"
            },
            {
                page: "payment",
                name: "Payment"
            },
            {
                page: "download-invoice",
                name: "Download Invoice"
            },
        ])

    }, [])
    return (
        <div>

            <div className="max-w-5xl mx-auto  py-10 px-4">

                <VariantHeading className='text-center py-6 gap-x-3 uppercase mb-6 flex items-center text-primary-color [font-family:var(--second-font)] font-black text-3xl lg:text-4xl max-w-fit mx-auto'>

                    <span
                        className='w-10  h-[1px] bg-primary-color/70 '
                    />  <span>Join us  today</span>
                    <span
                        className='w-10  h-[1px] bg-primary-color '
                    />

                </VariantHeading>
                <Scrollable
                    className='-mb-2 gap-x-1 scrollto sticky top-12 py-1 flex flex-nowrap overflow-x-auto   md:gap-x-2  z-[10] [--scroll-to-height:3px] max-w-fit px-4 mx-auto'
                    direction='row'
                >
                    {
                        pages.map((page, idx) => <CustomNavLink to={page.page} end
                            style={{
                                pointerEvents: "none"
                            }}
                            show
                            replace
                            selectedClassName='text-green-800  !pointer-events-none text-white bg-primary-color'
                            animateClassName="inset-0 animate-pulse size-full shadow-md  right-0  bg-purple-600/60 !pointer-events-none rounded-sm "
                            className=' text-xs relative z-20 bg-white lg:text-sm capitalize w-fit px-4 shadow text-medium rounded-sm   mb-0.5 h-9 flex items-center pointer-events-none!  hover:bg-purple-600/20'
                        >

                            <span className='text-[10px]! mr-1 font-black'>({idx + 1})</span> {page.name}</CustomNavLink>)
                    }
                </Scrollable>
                <div className="mx-auto max-w-3xl mt-6 flex justify-center items-center rounded-lg ">
                    <Outlet />
                </div>

            </div>

        </div>
    )
}
