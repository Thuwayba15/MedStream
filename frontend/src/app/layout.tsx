import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/theme/appProviders";
import "./globals.css";

const playfair = localFont({
    src: [
        {
            path: "../../public/PlayfairDisplay-VariableFont_wght.ttf",
            style: "normal",
        },
        {
            path: "../../public/PlayfairDisplay-Italic-VariableFont_wght.ttf",
            style: "italic",
        },
    ],
    variable: "--font-playfair",
    display: "swap",
});

export const metadata: Metadata = {
    title: "MedStream",
    description: "MedStream landing page for South African public health workflows.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={playfair.variable}>
            <body>
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
