import { useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { Input, TabBar, Avatar, Divider } from '../components/ui'
import { Button } from '@/components/ui/button';

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Company' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
]

function Toggle({ label, description, defaultOn }: { label: string; description?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false)
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`w-10 h-6 rounded-full transition-colors ${on ? 'bg-[#1E3A5F]' : 'bg-slate-200'} relative`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${on ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  )
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account preferences</p>
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Avatar initials="OW" size="xl" index={0} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Profile Photo</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-2">JPG, PNG or GIF. Max 2MB.</p>
                <Button variant="outline" size="sm">Upload Photo</Button>
              </div>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" defaultValue="Owen" />
              <Input label="Last Name" defaultValue="Wright" />
              <Input label="Email Address" type="email" defaultValue="owen@secureguard.co.uk" />
              <Input label="Phone" type="tel" defaultValue="+44 7700 900000" />
            </div>
            <div>
              <Input label="Job Title" defaultValue="Company Owner" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm">Cancel</Button>
              <Button size="sm" onClick={handleSave}>
                {saved ? <><Check size={13} /> Saved</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-800">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Company Name" defaultValue="SecureGuard Ltd" />
              <Input label="Company Registration" defaultValue="12345678" />
              <Input label="Industry" defaultValue="Security Services" />
              <Input label="Company Size" defaultValue="6–20 employees" />
            </div>
            <Input label="Website" icon={<Globe size={14} />} defaultValue="https://secureguard.co.uk" />
            <div className="flex justify-end gap-3 mt-2">
              <Button variant="outline" size="sm">Cancel</Button>
              <Button size="sm" onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] px-6">
            <div className="py-4 border-b border-[#F1F5F9]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Job Alerts</p>
            </div>
            <Toggle label="Job started" description="When a worker starts a job" defaultOn />
            <Toggle label="Job completed" description="When a worker finishes a job" defaultOn />
            <Toggle label="Job rejected" description="When a worker rejects an assignment" defaultOn />
            <Toggle label="Unassigned jobs" description="Alert when a job has no workers" defaultOn />
            <div className="py-4 border-b border-t border-[#F1F5F9] mt-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Team Alerts</p>
            </div>
            <Toggle label="New worker registered" defaultOn />
            <Toggle label="Worker goes offline" description="When GPS tracking is lost" />
            <Toggle label="Overtime alerts" description="When a worker exceeds hours threshold" defaultOn />
            <div className="py-4 border-b border-t border-[#F1F5F9] mt-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Communication Channels</p>
            </div>
            <Toggle label="Email notifications" defaultOn />
            <Toggle label="Push notifications" defaultOn />
            <Toggle label="SMS alerts" />
            <div className="pb-4" />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <Input label="New Password" type="password" placeholder="••••••••" />
              <Input label="Confirm New Password" type="password" placeholder="••••••••" />
              <div className="flex justify-end">
                <Button size="sm">Update Password</Button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E2E8F0] px-6">
              <div className="py-4 border-b border-[#F1F5F9]">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security Settings</p>
              </div>
              <Toggle label="Two-factor authentication" description="Add an extra layer of security" />
              <Toggle label="Login notifications" description="Get notified of new sign-ins" defaultOn />
              <Toggle label="Session timeout" description="Auto logout after 8 hours of inactivity" defaultOn />
              <div className="pb-4" />
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Current Plan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Billed monthly</p>
                </div>
                <span className="bg-[#1E3A5F] text-white text-xs font-semibold px-3 py-1 rounded-full">Enterprise</span>
              </div>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-bold text-slate-900">£149</span>
                <span className="text-slate-500 text-sm mb-1">/month</span>
              </div>
              <div className="flex flex-col gap-2 mb-5">
                {['Unlimited jobs', 'Up to 50 workers', 'Advanced analytics', 'Payroll export', 'Priority support', 'GPS tracking'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">Change Plan</Button>
                <Button variant="secondary" size="sm">Cancel Subscription</Button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Payment Method</h3>
              <div className="flex items-center gap-3 p-3.5 border border-[#E2E8F0] rounded-xl">
                <div className="w-10 h-7 bg-slate-800 rounded flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">VISA</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Visa ending in 4242</p>
                  <p className="text-xs text-slate-400">Expires 08/2027</p>
                </div>
                <button className="ml-auto text-xs text-blue-600 font-medium hover:text-blue-800">Update</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
