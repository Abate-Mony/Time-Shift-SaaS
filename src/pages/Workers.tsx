import SearchComponent from '@/components/Search'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter
} from "@/components/ui/drawer"
import { cn } from '@/lib/utils'
import customFetch from '@/utils/customFetch'
import { sleep } from '@/utils/sleep'
import type { User } from '@/utils/types'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { Briefcase, ChevronRight, Clock, Mail, Phone, Star, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLoaderData, useNavigation, type LoaderFunctionArgs, type Params } from 'react-router'
import { Avatar, Card, StatusBadge } from '../components/ui'
import { jobs } from '../data/mockData'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

function RadioGroupChoiceCard() {
  return (
    <RadioGroup name='role' defaultValue="manager" className="max-w-sm">
      <FieldLabel htmlFor="role" >
        <Field orientation="horizontal" >
          <FieldContent>
            <FieldTitle > Manager</FieldTitle>
            <FieldDescription>
              for managing and scheduling jobs for workers
            </FieldDescription>
          </FieldContent>
          <RadioGroupItem value="manager" id="role" />
        </Field>
      </FieldLabel>
      <FieldLabel htmlFor="pro-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Worker</FieldTitle>
            <FieldDescription>for working in site </FieldDescription>
          </FieldContent>
          <RadioGroupItem value="worker" id="pro-plan" />
        </Field>
      </FieldLabel>

    </RadioGroup>
  )
}

import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import { useMediaQuery } from 'react-responsive'
import z from 'zod'

const workersQuery = (params: Params) => {

  const { search,
    sort, page,
    status, date } = params;
  return (
    {


      queryKey: [
        'workers',
        {
          search: search ?? '',
          status: status ?? 'all',
          sort: sort ?? 'asc',
          page: page ?? 1,
          date: date ?? ''
        }
      ],
      queryFn: async () => {
        await sleep(3000)
        // This page is workers-only — managers show up on the Team page
        // instead. The backend narrows /users/users to just `role=worker`.
        const { data } = await customFetch.get<any>('/users/users', {
          params: { ...params, role: 'worker' }
        });
        return data;
      }
    }
  )
}
export const loader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {

  const params = Object.fromEntries([
    ...new URL(request.url).searchParams.entries(),
  ]);
  await queryClient.ensureQueryData(workersQuery(params))
  return ({
    searchValues: { ...params }
  })

}
const SelectedWorkerCard = ({ selectedWorker, setSelected, users, scope, workerJobs }: {
  selectedWorker: iUser,
  setSelected: any
  users: iUser[],
  scope: any,
  workerJobs?: any[]
}) => {
  return (
    <motion.div
      key={selectedWorker.email}
      ref={scope}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full sm:w-80 shrink-0  ">
      <Card className="p-5 relative md:sticky sm:top-19">
        <div className="flex items-start justify-between mb-4">
          <Avatar initials={selectedWorker?.fullname?.slice(0, 2)} size="xl" index={users.findIndex(w => w._id === selectedWorker._id)} />
          <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={14} />
          </button>
        </div>

        <h2 className="text-base font-semibold text-slate-900">{selectedWorker.fullname}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{selectedWorker.role ?? "role"}</p>
        <div className="mt-2"><StatusBadge status={"status"} /></div>

        <div className="mt-4 flex flex-row sm:flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Mail size={13} className="text-slate-400 shrink-0" />
            {selectedWorker.email}
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Phone size={13} className="text-slate-400 shrink-0" />
            {"phone number"}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#F1F5F9] grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-slate-900">{selectedWorker.hoursThisWeek}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">hrs/week</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{selectedWorker.jobsCompleted}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">jobs done</p>
          </div>
          <div className='hidden'>
            <p className="text-lg font-bold text-amber-600">{"selectedWorker.rating"}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">rating</p>
          </div>
        </div>

        <div className=''>
          <div className="mt-4 pt-4 border-t border-[#F1F5F9] ">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned Jobs</p>
            {workerJobs?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">No jobs assigned</p>
            ) : (
              <div className="flex flex-col gap-2">
                {workerJobs?.slice(0, 4).map(job => (
                  <div key={job.id} className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-700 font-medium truncate">{job.name}</p>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-row sm:flex-col gap-2">
            <Link to={`/workers/${selectedWorker._id}/worker-profile`} className='w-full'>
              <Button size="sm" className="w-full"
              >View Full Profile</Button>
            </Link>
            <Link to={"/create-job"} className='w-full'>
              <Button variant="outline" size="sm" className="w-full">Assign to Job</Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
export const createWorkerSchema = z.object({
  fullname: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),

  role: z.enum(["manager", "worker"], {
    invalid_type_error: "Please select a role",
  }),
});

// type CreateWorkerForm = z.infer<typeof createWorkerSchema>;

interface Props {
  className?: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface iUser extends User {
  hoursThisWeek: number,
  jobsCompleted: number
}
export function Workers() {

  const navigation = useNavigation();

  const isSearching = navigation.state === "loading";
  const { searchValues } = useLoaderData() as any
  const [selected, setSelected] = useState<string | null>(null)



  const { users, nHits } = useQuery(workersQuery(searchValues)).data as {
    users: iUser[], nHits: number
  }
  const selectedWorker = users.find(w => w._id === selected)
  const workerJobs = selectedWorker ? jobs.filter(j => j.workers.includes(selectedWorker._id)) : []
  const [open, setOpen] = useState(false)
  const [open_small_device, setOpenSmallDevice] = useState(false)
  const isDesktop = useMediaQuery({ minWidth: 768 })
  const buttonRef = useRef<any>(null)
  const [scope, animate] = useAnimate();
  useEffect(() => {
    animate(scope.current, { x: [20, 0] }, { duration: 0.25 });
  }, [selectedWorker?.email]);
  useEffect(() => {
    setOpenSmallDevice(selectedWorker != null)
  }, [selectedWorker])
  return (
    <div className="p-6 animate-fade-in">
      {/* add new user modal here  */}
   
      <Drawer open={open_small_device && !isDesktop} onOpenChange={setOpenSmallDevice} >

        <DrawerContent className='sm:hidden py-0 '>
          {selectedWorker && (
            <SelectedWorkerCard
              scope={scope}
              selectedWorker={selectedWorker}
              users={users}
              setSelected={setSelected}
              workerJobs={workerJobs}
            />
          )}
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* view worker drawer on small screen ends here  */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Workers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{nHits} workers across all locations</p>
        </div>
     
      </div>

      <div className="flex gap-5">
        {/* List */}
        <AnimatePresence mode='popLayout'>
          <div className="flex-1 min-w-0 transition-all duration-1000">
            {/* Search */}

            <SearchComponent />
            <div className={cn("grid grid-cols-1 gap-3",

              isSearching && "opacity-60"
            )}>
              {users.map((worker, i) => (
                <Card
                  key={worker._id}
                  onClick={() => {
                    const nextSelected = selected === worker._id ? null : worker._id;
                    setSelected(nextSelected);
                    setOpenSmallDevice(nextSelected !== null ? true : false);
                  }}
                  className={`p-4 transition-all ${selected === worker._id ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}
                >
                  <div className={cn("flex items-center gap-4",

                  )}>
                    <Avatar initials={worker?.fullname.slice(0, 2)} size="lg" index={i} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900">{worker?.fullname}</p>
                        <StatusBadge status={"active"} />
                      </div>
                      <p className="text-xs text-slate-500">{worker?.role} · {"location"}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={11} />{worker?.isActive}h this week
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Briefcase size={11} />{worker?.isVerified} jobs done
                        </span>
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <Star size={11} fill="currentColor" />{worker?.lastLogin}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <Mail size={14} />
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <Phone size={14} />
                      </button>
                      <ChevronRight size={14} className={`text-slate-300 transition-transform ${selected === worker._id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div className='hidden sm:block'>

            {selectedWorker && (
              <SelectedWorkerCard
                scope={scope}
                selectedWorker={selectedWorker}
                users={users}
                setSelected={setSelected}
                workerJobs={workerJobs}
              />
            )}
          </div>
          {/* Worker detail panel */}
        </AnimatePresence>
      </div>
    </div>
  )
}
