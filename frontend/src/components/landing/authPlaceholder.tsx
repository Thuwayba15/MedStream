"use client";

import { useLandingStyles } from "./style";

interface AuthPlaceholderProps {
    label: string;
}

export function AuthPlaceholder({ label }: AuthPlaceholderProps): React.JSX.Element {
    const { styles } = useLandingStyles();

    return <main className={styles.authPlaceholder}>{label}</main>;
}
