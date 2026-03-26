import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import { FieldTimeOutlined, FileTextOutlined, FormOutlined, RadarChartOutlined, SolutionOutlined } from "@ant-design/icons";

export interface LandingFeature {
    id: string;
    stepNumber: string;
    title: string;
    description: string;
    icon: ForwardRefExoticComponent<Omit<AntdIconProps, "ref"> & RefAttributes<HTMLSpanElement>>;
}

export const landingFeatures: LandingFeature[] = [
    {
        id: "intake",
        stepNumber: "01",
        title: "Patient Intake",
        description: "Symptoms captured via mobile or clerk, creating a structured starting point for the visit.",
        icon: FormOutlined,
    },
    {
        id: "triage",
        stepNumber: "02",
        title: "Rule-Based Smart Triage",
        description: "System applies rules, red flags, and urgency scoring so the sickest patients are surfaced first.",
        icon: RadarChartOutlined,
    },
    {
        id: "queue",
        stepNumber: "03",
        title: "Live Queue",
        description: "Patient waits while the clinician sees current priority, room movement, and queue progression in real time.",
        icon: FieldTimeOutlined,
    },
    {
        id: "consultation",
        stepNumber: "04",
        title: "Consultation",
        description: "Vitals are captured and MedStream helps clinicians draft structured SOAP documentation during care.",
        icon: FileTextOutlined,
    },
    {
        id: "resolution",
        stepNumber: "05",
        title: "Resolution",
        description: "The note is finalized and the visit is wrapped with clear follow-ups, records, and continuity of care.",
        icon: SolutionOutlined,
    },
];
