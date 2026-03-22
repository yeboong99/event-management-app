// (host) 라우트 그룹 레이아웃은 (app) 라우트 그룹으로 통합되었습니다.
// 이 파일은 더 이상 사용되지 않으며, 삭제 예정입니다.
// 실제 레이아웃은 app/(app)/layout.tsx를 참조하세요.

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
