import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCog, Users, Check } from "lucide-react";

interface Permission {
  name: string;
  admin: boolean;
  moderator: boolean;
  member: boolean;
}

const permissions: Permission[] = [
  { name: "Approve/Reject members", admin: true, moderator: false, member: false },
  { name: "Manage member roles", admin: true, moderator: false, member: false },
  { name: "Remove members", admin: true, moderator: false, member: false },
  { name: "Create group goals", admin: true, moderator: false, member: false },
  { name: "Schedule sessions", admin: true, moderator: true, member: false },
  { name: "Moderate discussions", admin: true, moderator: true, member: false },
  { name: "Update goal progress", admin: true, moderator: true, member: false },
  { name: "Join sessions", admin: true, moderator: true, member: true },
  { name: "Send messages", admin: true, moderator: true, member: true },
  { name: "Provide feedback", admin: true, moderator: true, member: true },
];

export function RolePermissionsGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
        <CardDescription>
          Understanding what each role can do in the group
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Permission</th>
                <th className="text-center py-3 px-2">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Admin</span>
                  </div>
                </th>
                <th className="text-center py-3 px-2">
                  <div className="flex items-center justify-center gap-2">
                    <UserCog className="w-4 h-4" />
                    <span className="text-sm">Moderator</span>
                  </div>
                </th>
                <th className="text-center py-3 px-2">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Member</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-3 px-2 text-sm">{permission.name}</td>
                  <td className="text-center py-3 px-2">
                    {permission.admin && (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-3 px-2">
                    {permission.moderator && (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-3 px-2">
                    {permission.member && (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Admin</p>
              <p className="text-xs text-muted-foreground">
                Full control over the group including member management and all permissions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary/5 rounded-lg">
            <UserCog className="w-5 h-5 text-secondary-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Moderator</p>
              <p className="text-xs text-muted-foreground">
                Can schedule sessions, moderate discussions, and update goal progress
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Member</p>
              <p className="text-xs text-muted-foreground">
                Can participate in sessions, send messages, and provide feedback
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
