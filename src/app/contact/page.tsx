import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import SubPageShell from "@/components/layout/SubPageShell";
import { pageMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "CONTACT",
  description:
    "FlexQ に関するご質問・不具合のご報告・ご要望などのお問い合わせフォームです。",
  path: routes.contact,
});

export default function ContactPage() {
  return (
    <SubPageShell title="CONTACT" width="narrow">
      <ContactForm />
    </SubPageShell>
  );
}
