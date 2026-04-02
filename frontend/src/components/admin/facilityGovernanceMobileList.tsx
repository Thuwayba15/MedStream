import { Button, Card, Empty, Space, Tag, Typography } from "antd";
import type { IFacility } from "@/providers/admin-governance/context";

interface IFacilityGovernanceMobileListProps {
    adminStyles: Record<string, string>;
    facilities: IFacility[];
    editFacilityForm: {
        setFieldsValue: (values: Record<string, unknown>) => void;
    };
    isMutating: boolean;
    setEditingFacility: React.Dispatch<React.SetStateAction<IFacility | null>>;
    setFacilityActivation: (id: number, isActive: boolean) => Promise<void>;
}

export const FacilityGovernanceMobileList = ({ adminStyles, facilities, editFacilityForm, isMutating, setEditingFacility, setFacilityActivation }: IFacilityGovernanceMobileListProps) => {
    if (facilities.length === 0) {
        return <Empty description="No facilities found" />;
    }

    return (
        <div className={adminStyles.mobileFacilityList}>
            {facilities.map((facility) => (
                <Card key={facility.id} className={adminStyles.mobileFacilityCard}>
                    <Space direction="vertical" size={12} className={adminStyles.fullWidth}>
                        <Space align="start" className={adminStyles.mobileCardHeader}>
                            <div>
                                <Typography.Title level={5} className={adminStyles.mobileCardTitle}>
                                    {facility.name}
                                </Typography.Title>
                                <Typography.Text type="secondary">{facility.code || "No code"}</Typography.Text>
                            </div>
                            <Tag color={facility.isActive ? "green" : "default"}>{facility.isActive ? "Active" : "Inactive"}</Tag>
                        </Space>

                        <div className={adminStyles.mobileFacilityMeta}>
                            <Typography.Text>{facility.facilityType || "-"}</Typography.Text>
                            <Typography.Text type="secondary">{facility.province || "-"}</Typography.Text>
                            <Typography.Text type="secondary">{facility.district || "-"}</Typography.Text>
                            <Typography.Text type="secondary">{facility.address || "-"}</Typography.Text>
                        </div>

                        <Space wrap>
                            <Button
                                className={adminStyles.secondaryActionButton}
                                onClick={() => {
                                    setEditingFacility(facility);
                                    editFacilityForm.setFieldsValue({
                                        name: facility.name,
                                        code: facility.code || undefined,
                                        facilityType: facility.facilityType || undefined,
                                        province: facility.province || undefined,
                                        district: facility.district || undefined,
                                        address: facility.address || undefined,
                                    });
                                }}
                            >
                                Edit
                            </Button>
                            <Button className={adminStyles.secondaryActionButton} loading={isMutating} onClick={() => void setFacilityActivation(facility.id, !facility.isActive)}>
                                {facility.isActive ? "Deactivate" : "Activate"}
                            </Button>
                        </Space>
                    </Space>
                </Card>
            ))}
        </div>
    );
};
