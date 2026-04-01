"use client";

import { useMemo } from "react";
import { Empty, Grid, Input, Select, Space, Table, Tabs, Typography } from "antd";
import { useAuthDashboardStyles } from "@/components/auth/dashboardStyle";
import { FacilityGovernanceMobileList } from "@/components/admin/facilityGovernanceMobileList";
import { GovernanceStats } from "@/components/admin/governanceStats";
import { useAdminStyles } from "@/components/admin/style";
import { type ApprovalFilter, type IClinicianApplicant, type IFacility } from "@/providers/admin-governance/context";
import { getApprovalStatusTone } from "@/lib/admin/governance";
import { useAdminGovernancePage } from "@/hooks/admin/useAdminGovernancePage";
import { buildApprovalColumns, buildFacilityColumns } from "@/components/admin/adminGovernanceColumns";
import { FacilityCreateForm } from "@/components/admin/facilityCreateForm";
import { DecisionModal } from "@/components/admin/decisionModal";
import { EditFacilityModal } from "@/components/admin/editFacilityModal";
import { RoleAppShell } from "@/components/layout/roleAppShell";

export const UserApprovalPage = () => {
    const screens = Grid.useBreakpoint();
    const { styles } = useAuthDashboardStyles();
    const { styles: adminStyles } = useAdminStyles();
    const viewModel = useAdminGovernancePage();
    const isMobile = !screens.md;

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
            <section className={adminStyles.pageHeader}>
                <div>
                    <Typography.Text className={adminStyles.pageEyebrow}>Administration</Typography.Text>
                    <Typography.Title level={1} className={adminStyles.pageTitle}>
                        Admin Governance
                    </Typography.Title>
                    <Typography.Paragraph className={adminStyles.pageIntro}>Review clinician applicants, assign facilities, and manage the active facility list from one place.</Typography.Paragraph>
                </div>
            </section>

            <GovernanceStats adminStyles={adminStyles} stats={viewModel.governanceStats} />

            <section className={`${styles.dashboardCard} ${adminStyles.panelCard} ${adminStyles.tableCard}`}>
                <Tabs
                    defaultActiveKey="approvals"
                    tabBarExtraContent={
                        <div className={adminStyles.pendingLivePill}>
                            <span className={adminStyles.pendingLiveDot} />
                            <span>{viewModel.governanceStats.pending} pending requests</span>
                        </div>
                    }
                    items={[
                        {
                            key: "approvals",
                            label: (
                                <span className={adminStyles.tabLabel}>
                                    Clinician Approvals
                                    <span className={adminStyles.tabCountBadge}>{viewModel.governanceStats.pending}</span>
                                </span>
                            ),
                            children: (
                                <Space orientation="vertical" size={16} className={adminStyles.fullWidth}>
                                    <div className={adminStyles.toolbar}>
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
                                    </div>

                                    <div className={adminStyles.tableWrap}>
                                        <Table<IClinicianApplicant>
                                            rowKey="id"
                                            loading={viewModel.isLoadingUsers}
                                            columns={approvalColumns}
                                            dataSource={viewModel.filteredUsers}
                                            rowClassName={(row) => `admin-approval-row admin-approval-row-${getApprovalStatusTone(row.approvalStatus)}`}
                                            locale={{ emptyText: <Empty description="No clinician applications found" /> }}
                                            pagination={{ pageSize: 10 }}
                                            scroll={{ x: 1380 }}
                                        />
                                    </div>
                                </Space>
                            ),
                        },
                        {
                            key: "facilities",
                            label: (
                                <span className={adminStyles.tabLabel}>
                                    Facility Governance
                                    <span className={adminStyles.tabCountBadge}>{viewModel.facilities.length}</span>
                                </span>
                            ),
                            children: (
                                <Space orientation="vertical" size={16} className={adminStyles.fullWidth}>
                                    <section className={adminStyles.facilityFormSection}>
                                        <FacilityCreateForm form={viewModel.facilityForm} isMutating={viewModel.isMutating} adminStyles={adminStyles} onCreateFacility={viewModel.onCreateFacility} />
                                    </section>

                                    {isMobile ? (
                                        <FacilityGovernanceMobileList
                                            adminStyles={adminStyles}
                                            facilities={viewModel.facilities}
                                            editFacilityForm={viewModel.editFacilityForm}
                                            isMutating={viewModel.isMutating}
                                            setEditingFacility={viewModel.setEditingFacility}
                                            setFacilityActivation={viewModel.setFacilityActivation}
                                        />
                                    ) : (
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
                                    )}
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
