import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";

type ComplaintPreview = {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
};

type DashboardData = {
  totalComplaints: number;
  statusCounts: {
    OPEN: number;
    IN_PROGRESS: number;
    RESOLVED: number;
    CLOSED: number;
    REJECTED: number;
  };
  last24hComplaints: number;
  recentComplaints: ComplaintPreview[];
  complaintsPerDay7: Array<{ _id: string; count: number }>;
  complaintsPerDay30: Array<{ _id: string; count: number }>;
  topUsers: Array<{ user_id: string; count: number }>;
  completionRate: number;
  agingBuckets: {
    "<24h": number;
    "1-3d": number;
    "3-7d": number;
    ">7d": number;
  };
  longestOpenComplaints: Array<{ id: string; title: string; createdAt: string }>;
  adminEfficiencyScore: number;
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [recentComplaints, setRecentComplaints] = useState<ComplaintPreview[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      setDashboardLoading(true);
      api
        .get("/dashboard")
        .then((res) => setDashboardData(res.data))
        .catch((err) => {
          console.error(err);
          alert("Failed to load dashboard data");
        })
        .finally(() => setDashboardLoading(false));
    } else {
      api
        .get("/complaints", { params: { limit: 3 } })
        .then((res) => setRecentComplaints(res.data.complaints ?? []))
        .catch((err) => console.error(err));
    }
  }, [user]);

  if (loading || dashboardLoading) return <div className="text-white p-10">Loading...</div>;
  if (!user) return null;

  // Admin Dashboard View
  if (user.role === "ADMIN" && dashboardData) {
    return (
      <div className="min-h-screen bg-black text-white p-10 space-y-8">
        <div>
          <p className="text-sm uppercase tracking-wider text-gray-400">Admin Dashboard</p>
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
          <p className="text-gray-300">Overview of all complaints and system metrics.</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Total Complaints</p>
            <p className="text-3xl font-bold">{dashboardData.totalComplaints}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Last 24 Hours</p>
            <p className="text-3xl font-bold">{dashboardData.last24hComplaints}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Completion Rate</p>
            <p className="text-3xl font-bold">{dashboardData.completionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Efficiency Score</p>
            <p className="text-3xl font-bold">{dashboardData.adminEfficiencyScore.toFixed(1)}%</p>
          </div>
        </div>

        {/* Status Counts */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{dashboardData.statusCounts.OPEN}</p>
              <p className="text-sm text-gray-400">OPEN</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{dashboardData.statusCounts.IN_PROGRESS}</p>
              <p className="text-sm text-gray-400">IN PROGRESS</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{dashboardData.statusCounts.RESOLVED}</p>
              <p className="text-sm text-gray-400">RESOLVED</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{dashboardData.statusCounts.CLOSED}</p>
              <p className="text-sm text-gray-400">CLOSED</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{dashboardData.statusCounts.REJECTED}</p>
              <p className="text-sm text-gray-400">REJECTED</p>
            </div>
          </div>
        </div>

        {/* Aging Buckets */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Complaint Aging</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{dashboardData.agingBuckets["<24h"]}</p>
              <p className="text-sm text-gray-400">Less than 24h</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{dashboardData.agingBuckets["1-3d"]}</p>
              <p className="text-sm text-gray-400">1-3 days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{dashboardData.agingBuckets["3-7d"]}</p>
              <p className="text-sm text-gray-400">3-7 days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{dashboardData.agingBuckets[">7d"]}</p>
              <p className="text-sm text-gray-400">More than 7 days</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Complaints */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Complaints</h2>
              <Link to="/complaints" className="text-sm text-red-400">
                See all
              </Link>
            </div>
            {dashboardData.recentComplaints.length === 0 ? (
              <p className="text-gray-400">No complaints yet.</p>
            ) : (
              <ul className="space-y-3">
                {dashboardData.recentComplaints.map((complaint) => (
                  <li
                    key={complaint.id}
                    className="flex justify-between items-center rounded border border-gray-800 px-4 py-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{complaint.title}</p>
                      <p className="text-xs text-gray-400">
                        {complaint.createdAt && new Date(complaint.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-800 ml-4">
                      {complaint.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Longest Open Complaints */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Longest Open Complaints</h2>
            {dashboardData.longestOpenComplaints.length === 0 ? (
              <p className="text-gray-400">No open complaints.</p>
            ) : (
              <ul className="space-y-3">
                {dashboardData.longestOpenComplaints.map((complaint) => (
                  <li
                    key={complaint.id}
                    className="flex justify-between items-center rounded border border-gray-800 px-4 py-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{complaint.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(complaint.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      to={`/complaints/${complaint.id}`}
                      className="text-xs text-red-400 ml-4"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Complaints Per Day - Last 7 Days */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Complaints Per Day (Last 7 Days)</h2>
          {dashboardData.complaintsPerDay7.length === 0 ? (
            <p className="text-gray-400">No data available.</p>
          ) : (
            <div className="space-y-2">
              {dashboardData.complaintsPerDay7.map((day) => {
                const maxCount = Math.max(...dashboardData.complaintsPerDay7.map(d => d.count), 1);
                const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                return (
                  <div key={day._id} className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-24">{day._id}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-6 relative">
                      <div
                        className="bg-red-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        {day.count > 0 && <span className="text-xs text-white">{day.count}</span>}
                      </div>
                    </div>
                    {day.count > 0 && <span className="text-sm w-12 text-right">{day.count}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Users */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Top Users by Complaint Count</h2>
          {dashboardData.topUsers.length === 0 ? (
            <p className="text-gray-400">No data available.</p>
          ) : (
            <ul className="space-y-3">
              {dashboardData.topUsers.map((user, index) => (
                <li
                  key={user.user_id}
                  className="flex justify-between items-center rounded border border-gray-800 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">#{index + 1} User ID: {user.user_id.substring(0, 8)}...</p>
                  </div>
                  <span className="text-lg font-bold">{user.count} complaints</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-4">
          <Link to="/complaints" className="px-6 py-3 border border-gray-700 rounded">
            View All Complaints
          </Link>
        </div>
      </div>
    );
  }

  // Citizen Dashboard View (Original)
  return (
    <div className="min-h-screen bg-black text-white p-10 space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wider text-gray-400">Dashboard</p>
        <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
        <p className="text-gray-300">
          Quickly create complaints, review their statuses, and stay informed.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        {user.role !== "ADMIN" && (
          <Link
            to="/complaints/create"
            className="px-6 py-3 bg-red-600 rounded text-white font-semibold"
          >
            Create Complaint
          </Link>
        )}
        <Link to="/complaints" className="px-6 py-3 border border-gray-700 rounded">
          View All
        </Link>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Complaints</h2>
          <Link to="/complaints" className="text-sm text-red-400">
            See all
          </Link>
        </div>
        {recentComplaints.length === 0 ? (
          <p className="text-gray-400">No complaints yet. Start by creating one!</p>
        ) : (
          <ul className="space-y-3">
            {recentComplaints.map((complaint) => (
              <li
                key={complaint.id}
                className="flex justify-between items-center rounded border border-gray-800 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{complaint.title}</p>
                  <p className="text-sm text-gray-400">{complaint.id}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-800">
                  {complaint.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
