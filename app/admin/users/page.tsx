import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 사용자 관리 페이지 — Server Component
export default async function AdminUsersPage() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          사용자 계정과 권한을 관리합니다.
        </p>
      </div>

      {/* 준비 중 상태 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>준비 중</CardTitle>
          <CardDescription>
            사용자 관리 기능이 곧 제공될 예정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            사용자 목록 조회, 역할 변경, 계정 관리 기능을 이 곳에서 확인하실 수
            있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
