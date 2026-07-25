export const workers = [
  { id: 'w1', name: 'James Mitchell', avatar: 'JM', role: 'Site Supervisor', email: 'james.m@company.com', phone: '+44 7700 900123', status: 'working', hoursThisWeek: 38.5, hoursThisMonth: 154, jobsCompleted: 47, rating: 4.9, location: 'London, UK', joined: '2022-03-15' },
  { id: 'w2', name: 'Sarah Chen', avatar: 'SC', role: 'Operative', email: 'sarah.c@company.com', phone: '+44 7700 900456', status: 'available', hoursThisWeek: 32, hoursThisMonth: 128, jobsCompleted: 31, rating: 4.7, location: 'London, UK', joined: '2023-01-10' },
  { id: 'w3', name: 'Marcus Brown', avatar: 'MB', role: 'Team Lead', email: 'marcus.b@company.com', phone: '+44 7700 900789', status: 'off', hoursThisWeek: 40, hoursThisMonth: 160, jobsCompleted: 89, rating: 4.8, location: 'Manchester, UK', joined: '2021-08-22' },
  { id: 'w4', name: 'Priya Patel', avatar: 'PP', role: 'Operative', email: 'priya.p@company.com', phone: '+44 7700 900321', status: 'working', hoursThisWeek: 36, hoursThisMonth: 144, jobsCompleted: 52, rating: 4.6, location: 'Birmingham, UK', joined: '2022-11-05' },
  { id: 'w5', name: 'Tom O\'Brien', avatar: 'TO', role: 'Operative', email: 'tom.ob@company.com', phone: '+44 7700 900654', status: 'available', hoursThisWeek: 24, hoursThisMonth: 96, jobsCompleted: 18, rating: 4.5, location: 'London, UK', joined: '2023-06-18' },
  { id: 'w6', name: 'Aisha Okafor', avatar: 'AO', role: 'Site Supervisor', email: 'aisha.o@company.com', phone: '+44 7700 900987', status: 'available', hoursThisWeek: 35, hoursThisMonth: 140, jobsCompleted: 63, rating: 4.9, location: 'Leeds, UK', joined: '2022-05-30' },
];

export const jobs = [
  { id: 'j1', name: 'Canary Wharf Security — Night Shift', company: 'SecureGuard Ltd', location: 'Canary Wharf, London E14', date: '2025-07-25', startTime: '22:00', endTime: '06:00', workers: ['w1', 'w4'], status: 'in-progress', priority: 'high', hours: 8, notes: 'Access via South entrance. Sign-in required.' },
  { id: 'j2', name: 'Heathrow Terminal 5 — Cleaning', company: 'CleanPro Services', location: 'Heathrow Terminal 5, TW6', date: '2025-07-25', startTime: '04:00', endTime: '12:00', workers: ['w2', 'w5'], status: 'assigned', priority: 'high', hours: 8, notes: 'Airside pass required. Report to Gate B42.' },
  { id: 'j3', name: 'Oxford Street Retail Support', company: 'RetailGroup UK', location: 'Oxford Street, London W1', date: '2025-07-26', startTime: '09:00', endTime: '17:00', workers: ['w6'], status: 'assigned', priority: 'medium', hours: 8, notes: '' },
  { id: 'j4', name: 'Waterloo Station Crowd Management', company: 'Network Rail', location: 'Waterloo Station, SE1', date: '2025-07-26', startTime: '07:30', endTime: '15:30', workers: ['w3'], status: 'pending', priority: 'high', hours: 8, notes: 'High footfall expected. Hi-vis mandatory.' },
  { id: 'j5', name: 'Excel Centre — Event Staffing', company: 'EventPro Ltd', location: 'ExCeL London, E16', date: '2025-07-24', startTime: '08:00', endTime: '20:00', workers: ['w1', 'w2', 'w3'], status: 'completed', priority: 'high', hours: 12, notes: '' },
  { id: 'j6', name: 'Canary Wharf — Day Patrol', company: 'SecureGuard Ltd', location: 'Canary Wharf, London E14', date: '2025-07-24', startTime: '06:00', endTime: '14:00', workers: ['w4'], status: 'completed', priority: 'medium', hours: 8, notes: '' },
  { id: 'j7', name: 'Westfield Stratford — Weekend Cover', company: 'RetailGroup UK', location: 'Westfield Stratford, E20', date: '2025-07-27', startTime: '10:00', endTime: '22:00', workers: ['w2', 'w5', 'w6'], status: 'assigned', priority: 'medium', hours: 12, notes: '' },
  { id: 'j8', name: 'City of London — Corporate Concierge', company: 'PremiumFM Ltd', location: 'Bank, London EC2', date: '2025-07-28', startTime: '08:00', endTime: '18:00', workers: [], status: 'draft', priority: 'low', hours: 10, notes: 'Client meeting first. Await confirmation.' },
];

export const activities = [
  { id: 'a1', type: 'started', worker: 'James Mitchell', job: 'Canary Wharf Security — Night Shift', time: '22:03', ago: '2h ago' },
  { id: 'a2', type: 'completed', worker: 'Sarah Chen', job: 'Excel Centre — Event Staffing', time: '20:05', ago: '4h ago' },
  { id: 'a3', type: 'accepted', worker: 'Tom O\'Brien', job: 'Westfield Stratford — Weekend Cover', time: '18:30', ago: '5h ago' },
  { id: 'a4', type: 'started', worker: 'Priya Patel', job: 'Canary Wharf Security — Night Shift', time: '22:01', ago: '2h ago' },
  { id: 'a5', type: 'rejected', worker: 'Marcus Brown', job: 'Oxford Street Retail Support', time: '16:45', ago: '7h ago' },
  { id: 'a6', type: 'completed', worker: 'Marcus Brown', job: 'Excel Centre — Event Staffing', time: '20:02', ago: '4h ago' },
];

export const weeklyHours = [
  { day: 'Mon', hours: 64, target: 80 },
  { day: 'Tue', hours: 72, target: 80 },
  { day: 'Wed', hours: 80, target: 80 },
  { day: 'Thu', hours: 56, target: 80 },
  { day: 'Fri', hours: 88, target: 80 },
  { day: 'Sat', hours: 48, target: 80 },
  { day: 'Sun', hours: 32, target: 80 },
];

export const monthlyStats = [
  { month: 'Jan', hours: 1240, jobs: 62 },
  { month: 'Feb', hours: 1180, jobs: 59 },
  { month: 'Mar', hours: 1420, jobs: 71 },
  { month: 'Apr', hours: 1380, jobs: 69 },
  { month: 'May', hours: 1560, jobs: 78 },
  { month: 'Jun', hours: 1490, jobs: 74 },
  { month: 'Jul', hours: 980, jobs: 49 },
];

export const notifications = [
  { id: 'n1', type: 'alert', title: 'Job started', message: 'James Mitchell started Canary Wharf Security', time: '2 min ago', read: false },
  { id: 'n2', type: 'success', title: 'Job completed', message: 'Sarah Chen completed Excel Centre Event Staffing', time: '4 hr ago', read: false },
  { id: 'n3', type: 'warning', title: 'Assignment pending', message: 'City of London — Corporate Concierge has no workers assigned', time: '1 day ago', read: true },
  { id: 'n4', type: 'info', title: 'New worker registered', message: 'Tom O\'Brien joined your team', time: '2 days ago', read: true },
];
