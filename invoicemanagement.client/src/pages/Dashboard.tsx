import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ClipboardDocumentListIcon, 
  BanknotesIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../components/ui/card';

// Mock data
const stats = [
  {
    title: 'Total Invoices',
    value: '2,458',
    change: '+14.2%',
    changeType: 'positive',
    icon: <DocumentTextIcon className="h-8 w-8 text-primary-500" />,
  },
  {
    title: 'Pending Approval',
    value: '36',
    change: '-4.5%',
    changeType: 'negative',
    icon: <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-500" />,
  },
  {
    title: 'Paid Amount',
    value: '$435,298',
    change: '+8.7%',
    changeType: 'positive',
    icon: <BanknotesIcon className="h-8 w-8 text-green-500" />,
  },
  {
    title: 'Open Projects',
    value: '12',
    change: '+2',
    changeType: 'positive',
    icon: <ChartBarIcon className="h-8 w-8 text-purple-500" />,
  },
];

const recentInvoices = [
  { id: 'INV-001', date: '2023-05-11', vendor: 'Tech Solutions LLC', amount: '$12,500', status: 'Paid' },
  { id: 'INV-002', date: '2023-05-09', vendor: 'Office Supplies Inc', amount: '$2,340', status: 'Pending' },
  { id: 'INV-003', date: '2023-05-08', vendor: 'Global Software Corp', amount: '$8,790', status: 'Processing' },
  { id: 'INV-004', date: '2023-05-05', vendor: 'Network Services Co', amount: '$5,400', status: 'Paid' },
  { id: 'INV-005', date: '2023-05-03', vendor: 'Hardware Systems', amount: '$3,220', status: 'Rejected' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div>
          <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-primary-900 dark:text-primary-300">
            Last updated: Today at 10:30 AM
          </span>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <motion.div key={stat.title} variants={item}>
            <Card>
              <CardContent className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
                  <div className="flex items-center mt-1">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span 
                      className={`text-sm font-medium ml-1 ${
                        stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
                  </div>
                </div>
                {stat.icon}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Last 5 invoices processed in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Invoice ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice) => (
                      <tr 
                        key={invoice.id} 
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {invoice.id}
                        </td>
                        <td className="px-4 py-3">{invoice.date}</td>
                        <td className="px-4 py-3">{invoice.vendor}</td>
                        <td className="px-4 py-3">{invoice.amount}</td>
                        <td className="px-4 py-3">
                          <span 
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === 'Paid' 
                                ? 'bg-green-100 text-green-800' 
                                : invoice.status === 'Pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : invoice.status === 'Processing' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <button className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
                View all invoices
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </button>
            </CardFooter>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status</CardTitle>
              <CardDescription>Overview of invoice statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Paid</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">15%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">12%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rejected</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">8%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '8%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Vendors</CardTitle>
                <CardDescription>By invoice count</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold">TS</div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Tech Solutions LLC</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">32 invoices</p>
                    </div>
                    <div className="ml-auto text-base font-semibold text-gray-900 dark:text-white">$145,230</div>
                  </li>
                  <li className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center text-secondary-700 dark:text-secondary-300 font-semibold">GS</div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Global Software Corp</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">28 invoices</p>
                    </div>
                    <div className="ml-auto text-base font-semibold text-gray-900 dark:text-white">$98,450</div>
                  </li>
                  <li className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-700 dark:text-yellow-300 font-semibold">NS</div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Network Services Co</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">21 invoices</p>
                    </div>
                    <div className="ml-auto text-base font-semibold text-gray-900 dark:text-white">$76,320</div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 