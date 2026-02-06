import Sidebar from "@/components/layout/Sidebar";
import HomeTabs from "@/components/home/HomeTabs";

export default function HomePage() {
  return (
    <main className="container">
      <div className="page-grid">
        <Sidebar />
        <div>
          <HomeTabs />
        </div>
      </div>
    </main>
  );
}
