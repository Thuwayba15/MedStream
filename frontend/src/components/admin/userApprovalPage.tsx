"use client";

import { useMemo } from "react";
import { Alert, Empty, Input, Select, Space, Table, Tabs, Tag } from "antd";
import { useAuthDashboardStyles } from "@/components/auth/dashboardStyle";
import { useAdminStyles } from "@/components/admin/style";
import { type ApprovalFilter, type IClinicianApplicant, type IFacility } from "@/providers/admin-governance/context";
import { useAdminGovernancePage } from "@/hooks/useAdminGovernancePage";
import { buildApprovalColumns, buildFacilityColumns } from "@/components/admin/adminGovernanceColumns";
import { FacilityCreateForm } from "@/components/admin/facilityCreateForm";
import { DecisionModal } from "@/components/admin/decisionModal";
import { EditFacilityModal } from "@/components/admin/editFacilityModal";
import { RoleAppShell } from "@/components/layout/roleAppShell";

export const UserApprovalPage = () => {
    const { styles } = useAuthDashboardStyles();
    const { styles: adminStyles } = useAdminStyles();
    const viewModel = useAdminGovernancePage();

    const approvalColumns = useMemo(
        () =>
            buildApprovalColumns({
                adminStyles,
                activeFacilities: viewModel.activeFacilities,
                assigningFacilityByUserId: viewModel.assigningFacilityByUserId,
                setAssigningFacilityByUserId: viewModel.setAssigningFacilityByUserId,
                isMutating: viewModel.isMutating,
                onAssignFacility: viewModel.onAssignFacility,
                openDecisionModal: viewModel.openDecisionModal,
            }),
        [
            adminStyles,
            viewModel.activeFacilities,
            viewModel.assigningFacilityByUserId,
            viewModel.setAssigningFacilityByUserId,
            viewModel.isMutating,
            viewModel.onAssignFacility,
            viewModel.openDecisionModal,
        ]
    );

    const facilityColumns = useMemo(
        () =>
            buildFacilityColumns({
                adminStyles,
                editFacilityForm: viewModel.editFacilityForm,
                isMutating: viewModel.isMutating,
                setEditingFacility: viewModel.setEditingFacility,
                setFacilityActivation: viewModel.setFacilityActivation,
            }),
        [adminStyles, viewModel.editFacilityForm, viewModel.isMutating, viewModel.setEditingFacility, viewModel.setFacilityActivation]
    );

    return (
        <RoleAppShell roleLabel="Admin" items={[]}>
            {viewModel.messageContextHolder}
            {viewModel.successMessage ? <Alert type="success" title={viewModel.successMessage} showIcon /> : null}
            {viewModel.errorMessage ? <Alert type="error" title={viewModel.errorMessage} showIcon /> : null}

            <section className={`${styles.dashboardCard} ${adminStyles.panelCard} ${adminStyles.tableCard}`}>
                <Tabs
                    tabBarExtraContent={
                        <Tag className={adminStyles.pendingBadge} color={viewModel.pendingCount > 0 ? "gold" : "green"}>
                            {viewModel.pendingCount} pending requests
                        </Tag>
                    }
                    items={[
                        {
                            key: "approvals",
                            label: "Clinician Approvals",
                            children: (
                                <Space orientation="vertical" size={16} className={adminStyles.fullWidth}>
                                    <Space wrap>
                                        <Input.Search
                                            placeholder="Search by name, email, registration or facility"
                                            allowClear
                                            className={adminStyles.searchInput}
                                            value={viewModel.searchText}
                                            onChange={(event) => viewModel.setSearchText(event.target.value)}
                                        />
                                        <Select<ApprovalFilter>
                                            value={viewModel.approvalFilter}
                                            className={adminStyles.filterSelect}
                                            onChange={(value) => viewModel.setApprovalFilter(value)}
                                            options={[
                                                { value: "All", label: "All statuses" },
                                                { value: "PendingApproval", label: "Pending approval" },
                                                { value: "Approved", label: "Approved" },
                                                { value: "Rejected", label: "Rejected" },
                                            ]}
                                        />
                                    </Space>

                                    <div className={adminStyles.tableWrap}>
                                        <Table<IClinicianApplicant>
                                            rowKey="id"
                                            loading={viewModel.isLoadingUsers}
                                            columns={approvalColumns}
                                            dataSource={viewModel.filteredUsers}
                                            locale={{ emptyText: <Empty description="No clinician applications found" /> }}
                                            pagination={{ pageSize: 10 }}
                                            scroll={{ x: 1700 }}
                                        />
                                    </div>
                                </Space>
                            ),
                        },
                        {
                            key: "facilities",
                            label: "Facility Governance",
                            children: (
                                <Space orientation="vertical" size={16} className={adminStyles.fullWidth}>
                                    <section className={adminStyles.facilityFormSection}>
                                        <FacilityCreateForm form={viewModel.facilityForm} isMutating={viewModel.isMutating} adminStyles={adminStyles} onCreateFacility={viewModel.onCreateFacility} />
                                    </section>

                                    <div className={adminStyles.tableWrap}>
                                        <Table<IFacility>
                                            rowKey="id"
                                            loading={viewModel.isLoadingFacilities}
                                            columns={facilityColumns}
                                            dataSource={viewModel.facilities}
                                            locale={{ emptyText: <Empty description="No facilities found" /> }}
                                            pagination={{ pageSize: 10 }}
                                        />
                                    </div>
                                </Space>
                            ),
                        },
                    ]}
                />
            </section>

            <DecisionModal
                decisionMode={viewModel.decisionMode}
                decisionTargetUserId={viewModel.decisionTargetUserId}
                isMutating={viewModel.isMutating}
                decisionForm={viewModel.decisionForm}
                onSubmitDecision={viewModel.onSubmitDecision}
                setDecisionTargetUserId={viewModel.setDecisionTargetUserId}
            />

            <EditFacilityModal
                editingFacility={viewModel.editingFacility}
                isMutating={viewModel.isMutating}
                editFacilityForm={viewModel.editFacilityForm}
                adminStyles={adminStyles}
                onUpdateFacility={viewModel.onUpdateFacility}
                setEditingFacility={viewModel.setEditingFacility}
            />
        </RoleAppShell>
    );
};
