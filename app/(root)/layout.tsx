import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import {getSessionUser} from "@/lib/better-auth/session";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    // Cached per request, so pages calling getSessionUser() reuse this lookup.
    const sessionUser = await getSessionUser();

    if(!sessionUser) redirect('/sign-in');

    const user = {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
    }

    return (
        <main className="min-h-screen text-fg-muted">
            <Header user={user} />

            {/* Bottom padding on phones clears the fixed tab bar. */}
            <div className="container py-10 pb-28 sm:pb-10">
                {children}
            </div>
            <MobileNav />
        </main>
    )
}
export default Layout