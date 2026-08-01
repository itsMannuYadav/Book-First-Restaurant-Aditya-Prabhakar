import type { Metadata } from "next";
import { PublicMenuLoader } from "@/features/menu-public/components/public-menu-loader";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Menu · ${slug}`,
    description: "Digital restaurant menu",
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  return <PublicMenuLoader slug={slug} />;
}
