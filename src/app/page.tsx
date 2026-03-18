import { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import HomeContent from "./HomeContent";
import { supabase } from "@/lib/supabase";

type Props = {
    searchParams: { id?: string };
};

export async function generateMetadata(
    { searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = searchParams.id;

    if (id) {
        const { data: listing } = await supabase
            .from("listings")
            .select("title, description, images")
            .eq("id", id)
            .single();

        if (listing) {
            const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

            return {
                title: `${listing.title} | finHouse`,
                description: listing.description || "Confira este imóvel incrível no portal finHouse.",
                openGraph: {
                    title: listing.title,
                    description: listing.description,
                    images: firstImage ? [firstImage] : [],
                    type: "website",
                },
                twitter: {
                    card: "summary_large_image",
                    title: listing.title,
                    description: listing.description,
                    images: firstImage ? [firstImage] : [],
                },
            };
        }
    }

    return {
        title: "finHouse | Portal de Imóveis, Financiamentos e Consórcio",
        description: "A finHouse é o seu portal de imóveis, financiamentos e consórcios. Encontre imóveis, simule financiamento e muito mais.",
    };
}

export default function Page() {
    return (
        <Suspense fallback={null}>
            <HomeContent />
        </Suspense>
    );
}
