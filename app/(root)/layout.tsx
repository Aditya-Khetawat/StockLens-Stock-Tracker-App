import Header from "@/components/Header";
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
        <main className="min-h-screen text-gray-400">
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}
export default Layout