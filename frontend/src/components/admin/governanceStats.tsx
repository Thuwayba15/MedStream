import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, TeamOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import type { IAdminGovernanceStats } from "@/lib/admin/governance";

interface IGovernanceStatsProps {
    adminStyles: Record<string, string>;
    stats: IAdminGovernanceStats;
}

export const GovernanceStats = ({ adminStyles, stats }: IGovernanceStatsProps) => {
    const cards = [
        {
            key: "pending",
            label: "Pending",
            value: stats.pending,
            tone: "pending",
            icon: <ClockCircleOutlined />,
        },
        {
            key: "approved",
            label: "Approved",
            value: stats.approved,
            tone: "approved",
            icon: <CheckCircleOutlined />,
        },
        {
            key: "declined",
            label: "Declined",
            value: stats.declined,
            tone: "declined",
            icon: <CloseCircleOutlined />,
        },
        {
            key: "total",
            label: "Total Applicants",
            value: stats.total,
            tone: "default",
            icon: <TeamOutlined />,
        },
    ] as const;

    return (
        <section className={adminStyles.statStrip} aria-label="Governance stats">
            {cards.map((card) => (
                <article key={card.key} className={`${adminStyles.statCard} ${adminStyles[`statCard${card.tone.charAt(0).toUpperCase()}${card.tone.slice(1)}`]}`}>
                    <div className={`${adminStyles.statIcon} ${adminStyles[`statIcon${card.tone.charAt(0).toUpperCase()}${card.tone.slice(1)}`]}`}>{card.icon}</div>
                    <div>
                        <Typography.Text className={adminStyles.statLabel}>{card.label}</Typography.Text>
                        <Typography.Title level={2} className={`${adminStyles.statValue} ${adminStyles[`statValue${card.tone.charAt(0).toUpperCase()}${card.tone.slice(1)}`]}`}>
                            {card.value}
                        </Typography.Title>
                    </div>
                </article>
            ))}
        </section>
    );
};
