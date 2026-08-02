import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Palette, Mail, Users, Key, ScrollText } from "lucide-react";
import PageHeader from "@/components/ui/shared/page-header";

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your organisation configuration" actions={undefined} breadcrumbs={undefined} />
      <Tabs defaultValue="company">
        <TabsList className="flex-wrap">
          <TabsTrigger value="company"><Building2 className="mr-1.5 h-4 w-4" /> Company</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="mr-1.5 h-4 w-4" /> Branding</TabsTrigger>
          <TabsTrigger value="roles"><Users className="mr-1.5 h-4 w-4" /> Roles</TabsTrigger>
          <TabsTrigger value="email"><Mail className="mr-1.5 h-4 w-4" /> Email</TabsTrigger>
          <TabsTrigger value="api"><Key className="mr-1.5 h-4 w-4" /> API</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="mr-1.5 h-4 w-4" /> Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <Card className="max-w-2xl shadow-soft">
            <CardHeader><CardTitle>Company Details</CardTitle><CardDescription>Your organisation information</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Company Name</Label><Input defaultValue="TimeShift Security Ltd" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Industry</Label>
                  <Select defaultValue="security"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="security">Security</SelectItem><SelectItem value="cleaning">Cleaning</SelectItem><SelectItem value="events">Events</SelectItem><SelectItem value="logistics">Logistics</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label>Timezone</Label>
                  <Select defaultValue="utc"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="utc">UTC</SelectItem><SelectItem value="gmt">GMT (London)</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Working Hours</Label>
                <div className="flex gap-2">
                  <Input type="time" defaultValue="08:00" /><span className="self-center text-muted-foreground">—</span><Input type="time" defaultValue="18:00" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Overtime Rules</p><p className="text-xs text-muted-foreground">Pay 1.5x after 40 hours/week</p></div>
                <Switch defaultChecked />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-4">
          <Card className="max-w-2xl shadow-soft">
            <CardHeader><CardTitle>Branding</CardTitle><CardDescription>Customise your platform appearance</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Primary Colour</Label>
                <div className="flex gap-2">
                  {["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"].map((c) => (
                    <button key={c} className="h-9 w-9 rounded-lg border-2 border-border" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="text-sm font-medium">Dark Mode</p><p className="text-xs text-muted-foreground">Enable dark theme</p></div><Switch /></div>
              <Button>Save Branding</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl">
            {[
              { role: "Admin", desc: "Full access to all features", dot: "bg-primary" },
              { role: "Manager", desc: "Manage jobs and workers", dot: "bg-warning" },
              { role: "Worker", desc: "Worker Portal access only", dot: "bg-success" },
            ].map((r) => (
              <Card key={r.role} className="shadow-soft"><CardHeader><CardTitle className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${r.dot}`} /> {r.role}</CardTitle><CardDescription>{r.desc}</CardDescription></CardHeader></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card className="max-w-2xl shadow-soft">
            <CardHeader><CardTitle>Email Templates</CardTitle><CardDescription>Configure notification emails</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {["Job Assignment", "Shift Reminder", "Timesheet Approval", "Document Expiry", "Payroll Ready"].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/30">
                  <span className="text-sm font-medium">{t}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card className="max-w-2xl shadow-soft">
            <CardHeader><CardTitle>API Keys</CardTitle><CardDescription>Manage integration keys</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Production Key</p><p className="font-mono text-xs text-muted-foreground">ts_live_••••••••••••3f9a</p></div>
                <Button variant="secondary" size="sm">Regenerate</Button>
              </div>
              <Button variant="secondary">Generate New Key</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="rounded-2xl border border-border bg-card shadow-soft">
            <div className="divide-y divide-border">
              {[
                { user: "Alex Morgan", action: "Updated job settings", time: "2 min ago" },
                { user: "Alex Morgan", action: "Created new worker", time: "1 hour ago" },
                { user: "Jordan Lee", action: "Clock in - Westfield", time: "3 hours ago" },
                { user: "Sam Carter", action: "Accepted job - O2 Arena", time: "5 hours ago" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div><p className="text-sm font-medium">{log.user}</p><p className="text-xs text-muted-foreground">{log.action}</p></div>
                  <span className="text-xs text-muted-foreground">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}