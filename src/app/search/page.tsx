 "use client";

 import Sidebar from "@/components/layout/Sidebar";
 import UserSearch from "@/components/layout/UserSearch";

 export default function SearchPage() {
   return (
     <main className="container">
       <div className="page-grid">
         <Sidebar />
         <div className="panel p-8 rounded-none">
           <h1 className="text-xl font-semibold text-[color:var(--ink)]">
             Search
           </h1>
           <p className="mt-1 text-sm text-[color:var(--subtle)]">
             Find people by name or username.
           </p>
           <div className="mt-6">
             <UserSearch />
           </div>
         </div>
       </div>
     </main>
   );
 }
