import React from 'react';
import { PMOReviewPanel } from '../components/invoices/PMOReviewPanel';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { UserCheck, AlertTriangle } from 'lucide-react';

const PMOReviewPage = () => {
  const { user } = useAuth();

  // Redirect non-PMO users
  if (user?.role !== 'PMO') {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Access Denied</h3>
                <p className="text-red-600 text-sm mt-1">
                  You don't have permission to access the PMO Review panel. This feature is only available for PMO users.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <UserCheck className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PMO Review Panel</h1>
          <p className="text-gray-600 mt-1">
            Review and approve invoices that are pending PMO review
          </p>
        </div>
      </div>

      {/* PMO Review Panel */}
      <PMOReviewPanel />
    </div>
  );
};

export default PMOReviewPage;
