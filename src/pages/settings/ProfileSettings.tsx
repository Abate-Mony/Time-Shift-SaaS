import { useState } from 'react'
import { Check } from 'lucide-react'
import { Avatar, Divider, Input } from '@/components/ui'
import { Button } from '@/components/ui/button'

export default function ProfileSettings() {
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col gap-5 min-w-0">
                <div className="flex items-center gap-4 min-w-0">
                    <Avatar initials="OW" size="xl" index={0} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Profile Photo</p>
                        <p className="text-xs text-slate-500 mt-0.5 mb-2">JPG, PNG or GIF. Max 2MB.</p>
                        <Button variant="outline" size="sm">Upload Photo</Button>
                    </div>
                </div>
                <Divider />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                    <Input label="First Name" defaultValue="Owen" />
                    <Input label="Last Name" defaultValue="Wright" />
                    <Input label="Email Address" type="email" defaultValue="owen@secureguard.co.uk" />
                    <Input label="Phone" type="tel" defaultValue="+44 7700 900000" />
                </div>
                <div className="min-w-0">
                    <Input label="Job Title" defaultValue="Company Owner" />
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" size="sm">Cancel</Button>
                    <Button size="sm" onClick={handleSave}>
                        {saved ? <><Check size={13} /> Saved</> : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
