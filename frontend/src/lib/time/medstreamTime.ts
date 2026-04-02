const MEDSTREAM_LOCALE = "en-ZA";
const MEDSTREAM_TIME_ZONE = "Africa/Johannesburg";

const parseDate = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatMedstreamDate = (value?: string | null): string => {
    const parsed = parseDate(value);
    if (!parsed) {
        return value ?? "-";
    }

    return parsed.toLocaleDateString(MEDSTREAM_LOCALE, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: MEDSTREAM_TIME_ZONE,
    });
};

export const formatMedstreamDateTime = (value?: string | null): string => {
    const parsed = parseDate(value);
    if (!parsed) {
        return value ?? "-";
    }

    return parsed.toLocaleString(MEDSTREAM_LOCALE, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: MEDSTREAM_TIME_ZONE,
    });
};

export const formatMedstreamTime = (value?: string | null): string => {
    const parsed = parseDate(value);
    if (!parsed) {
        return value ?? "-";
    }

    return parsed.toLocaleTimeString(MEDSTREAM_LOCALE, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: MEDSTREAM_TIME_ZONE,
    });
};

export const getMedstreamTimeZone = (): string => MEDSTREAM_TIME_ZONE;
