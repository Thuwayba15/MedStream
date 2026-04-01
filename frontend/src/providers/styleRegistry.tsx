"use client";

import { createCache, extractStyle } from "@ant-design/cssinjs";
import { useServerInsertedHTML } from "next/navigation";
import { PropsWithChildren, useState } from "react";
import { StyleProvider } from "@/theme/theme";

export const StyleRegistry = ({ children }: PropsWithChildren): React.JSX.Element => {
    const [cache] = useState(() => createCache());

    useServerInsertedHTML(() => {
        const styleText = extractStyle(cache, {
            plain: true,
            once: true,
        });

        if (styleText.includes(".data-ant-cssinjs-cache-path{content:\"\";}")) {
            return null;
        }

        return (
            <style
                id="medstream-antd-cssinjs"
                data-rc-order="prepend"
                data-rc-priority="-1000"
                dangerouslySetInnerHTML={{ __html: styleText }}
            />
        );
    });

    return (
        <StyleProvider cache={cache} hashPriority="high">
            {children}
        </StyleProvider>
    );
};
