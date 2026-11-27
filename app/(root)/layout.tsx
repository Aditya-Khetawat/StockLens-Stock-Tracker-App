import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import {isDemoEmail} from "@/lib/demo/constants";
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

    // Sign-in works before verification; this nudges until the address is confirmed.
    const needsVerification = !sessionUser.emailVerified && !isDemoEmail(sessionUser.email);

    return (
        <div className="min-h-screen text-fg-muted">
            <Header user={user} />
            {needsVerification && <VerifyEmailBanner email={sessionUser.email} />}

            {/* Bottom padding on phones clears the fixed tab bar. */}
            <main className="container pt-8 pb-28 md:pt-10 md:pb-16">
                {children}
            </main>
            <MobileNav />
        </div>
    )
}
export default Layout