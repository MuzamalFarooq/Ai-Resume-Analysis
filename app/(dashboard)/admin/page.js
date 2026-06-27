"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminBarChart } from "@/components/charts/charts";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDate } from "@/utils/cn";
import {
  Users,
  FileText,
  MessageSquare,
  Target,
  Shield,
  Trash2,
} from "lucide-react";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin"),
        fetch("/api/admin/users"),
      ]);

      if (statsRes.ok) {
        setData(await statsRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, role) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        toast.success("Role updated");
        fetchData();
      }
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm("Delete this user and all their data?")) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast.success("User deleted");
        fetchData();
      }
    } catch {
      toast.error("Failed to delete user");
    }
  }

  if (loading) return <DashboardSkeleton />;

  const stats = data?.stats;

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
    { label: "Resumes Analyzed", value: stats?.completedResumes || 0, icon: FileText, color: "text-green-500" },
    { label: "Interviews Completed", value: stats?.completedInterviews || 0, icon: MessageSquare, color: "text-purple-500" },
    { label: "Avg ATS Score", value: `${stats?.avgAtsScore || 0}%`, icon: Target, color: "text-orange-500" },
  ];

  const chartData = data?.resumesByMonth?.map((item) => ({
    name: `${item._id.month}/${item._id.year}`,
    count: item.count,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform analytics and user management</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumes by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminBarChart data={chartData} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>{users?.total || 0} total users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Resumes</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.users?.map((user) => (
                  <tr key={user._id || user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3 text-muted-foreground">{user.email}</td>
                    <td className="p-3">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-3">{user.resumeCount || 0}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRoleChange(
                              user._id || user.id,
                              user.role === "admin" ? "user" : "admin"
                            )
                          }
                        >
                          Toggle Role
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id || user.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
