import Link from "next/link";

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
    return (
        <div className="pt-2 text-center">
            <p className="text-sm text-fg-subtle">
                {text}{` `}
                <Link href={href} className="footer-link">
                    {linkText}
                </Link>
            </p>
        </div>
    )
}
export default FooterLink