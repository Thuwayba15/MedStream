"use client";

import { Alert, Button } from "antd";

interface IConsultationFeedbackBannersProps {
    errorMessage?: string | null;
    successMessage?: string | null;
    recordingError?: string | null;
    onClearMessages: () => void;
    onClearRecordingError: () => void;
}

export const ConsultationFeedbackBanners = ({
    errorMessage,
    successMessage,
    recordingError,
    onClearMessages,
    onClearRecordingError,
}: IConsultationFeedbackBannersProps): React.JSX.Element => {
    return (
        <>
            {errorMessage ? (
                <Alert
                    type="error"
                    showIcon
                    title={errorMessage}
                    action={
                        <Button size="small" onClick={onClearMessages}>
                            Dismiss
                        </Button>
                    }
                />
            ) : null}
            {successMessage ? (
                <Alert
                    type="success"
                    showIcon
                    title={successMessage}
                    action={
                        <Button size="small" onClick={onClearMessages}>
                            Close
                        </Button>
                    }
                />
            ) : null}
            {recordingError ? (
                <Alert
                    type="warning"
                    showIcon
                    title={recordingError}
                    action={
                        <Button size="small" onClick={onClearRecordingError}>
                            Dismiss
                        </Button>
                    }
                />
            ) : null}
        </>
    );
};
