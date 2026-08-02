import { Search } from 'lucide-react'
import React, { useEffect } from 'react'
import { useFilter } from '../hooks/CustomLinkFilterHook'
import { useSearchParams } from 'react-router'
import debounce from '../utils/debounce'
import { cn } from '../lib/utils'
interface iSearch
    extends React.InputHTMLAttributes<HTMLInputElement> {
    containerClassName?: string

}
// interface iSearch {
//     className?: string,


// }
function SearchComponent({
    containerClassName, placeholder,
    ...props
}: iSearch) {
    const { handleFilterChange } = useFilter()
    const handleChange = (event: any) => {
        handleFilterChange({
            key: "search",
            value: event.target.value
        })
    };
    const debouncedHandleChange = debounce(handleChange, 500);
    const [sp] = useSearchParams();
    const searchVal = sp.get("search")
    useEffect(() => {
        if (typeof searchVal == "string" && searchVal.length < 1) {
            handleFilterChange({
                key: "search"
            })
        }
    }, [searchVal])
    return (
        <div>
            <div className="relative mb-4 ">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    //   value={search}
                    defaultValue={searchVal || ""}
                    onChange={debouncedHandleChange}
                    placeholder={
                        placeholder ?? 'Search...'
                    }

                    className="w-full h-9 pl-9 pr-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    {...props} />
            </div>
        </div>
        // <div className={
        //     cn('flex max-w-2xl w-full  mx-auto items-stretch h-10 parent border-secondary rounded-lg cursor-pointer border-[3px]',
        //         containerClassName
        //     )

        // }>
        //     <input
        //         className={
        //             cn(`flex-1 h-full
        //         border-none
        //         outline-none
        //         rounded-none
        //         shadow-none
        //         text-sm
        //         pl-4

        //         `)
        //         }
        //         style={{ border: '0px' }}
        //         defaultValue={searchVal || ""}
        //         onChange={debouncedHandleChange}
        //         // onChange={(e) => handleFilterChange({ key: "search", value: e.target.value })}
        //         placeholder='Search...'

        //         {...props}
        //     ></input>
        //     <span className='flex-none flex justify-center items-center'>
        //         <Search />
        //     </span>
        // </div>
    )
}

export default SearchComponent