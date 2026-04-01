"use client";

import { Form, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { type IDecisionFormValues, type IFacilityFormValues } from "@/components/admin/types";
import { buildAdminGovernanceStats } from "@/lib/admin/governance";
import { useAdminGovernanceActions, useAdminGovernanceState } from "@/providers/admin-governance";
import { type ApprovalFilter, type IFacility } from "@/providers/admin-governance/context";

export const useAdminGovernancePage = () => {
    const { users, facilities, isLoadingUsers, isLoadingFacilities, isMutating, errorMessage, successMessage, searchText, approvalFilter } = useAdminGovernanceState();
    const { loadGovernanceData, setSearchText, setApprovalFilter, clearMessages, approveClinician, declineClinician, createFacility, updateFacility, setFacilityActivation, assignClinicianFacility } =
        useAdminGovernanceActions();

    const [messageApi, messageContextHolder] = message.useMessage();
    const [decisionTargetUserId, setDecisionTargetUserId] = useState<number | null>(null);
    const [decisionMode, setDecisionMode] = useState<"approve" | "decline">("approve");
    const [decisionForm] = Form.useForm<IDecisionFormValues>();
    const [facilityForm] = Form.useForm<IFacilityFormValues>();
    const [editingFacility, setEditingFacility] = useState<IFacility | null>(null);
    const [editFacilityForm] = Form.useForm<IFacilityFormValues>();
    const [assigningFacilityByUserId, setAssigningFacilityByUserId] = useState<Record<number, number | undefined>>({});
    const hasLoadedGovernanceRef = useRef(false);

    useEffect(() => {
        if (successMessage) {
            void messageApi.success(successMessage);
        }
    }, [messageApi, successMessage]);

    useEffect(() => {
        if (errorMessage) {
            void messageApi.error(errorMessage);
        }
    }, [errorMessage, messageApi]);

    useEffect(() => {
        if (hasLoadedGovernanceRef.current) {
            return;
        }

        hasLoadedGovernanceRef.current = true;
        void loadGovernanceData();
    }, [loadGovernanceData]);

    const activeFacilities = useMemo(() => facilities.filter((facility) => facility.isActive), [facilities]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();
        return users.filter((user) => {
            const status = user.approvalStatus ?? "Approved";
            const matchesStatus = approvalFilter === "All" || status === approvalFilter;
            const matchesSearch =
                normalizedSearch.length === 0 ||
                `${user.name} ${user.surname}`.toLowerCase().includes(normalizedSearch) ||
                user.emailAddress.toLowerCase().includes(normalizedSearch) ||
                (user.registrationNumber ?? "").toLowerCase().includes(normalizedSearch) ||
                (user.requestedFacility ?? "").toLowerCase().includes(normalizedSearch) ||
                (user.phoneNumber ?? "").toLowerCase().includes(normalizedSearch);

            return matchesStatus && matchesSearch;
        });
    }, [users, searchText, approvalFilter]);

    const governanceStats = useMemo(() => buildAdminGovernanceStats(users), [users]);

    const openDecisionModal = (userId: number, mode: "approve" | "decline"): void => {
        clearMessages();
        setDecisionTargetUserId(userId);
        setDecisionMode(mode);
        decisionForm.resetFields();
    };

    const onSubmitDecision = async (values: IDecisionFormValues): Promise<void> => {
        if (!decisionTargetUserId) {
            return;
        }

        if (decisionMode === "approve") {
            await approveClinician(decisionTargetUserId, values.decisionReason);
        } else {
            await declineClinician(decisionTargetUserId, values.decisionReason);
        }

        setDecisionTargetUserId(null);
    };

    const onCreateFacility = async (values: IFacilityFormValues): Promise<void> => {
        await createFacility({
            name: values.name.trim(),
            code: values.code?.trim() || null,
            facilityType: values.facilityType || null,
            province: values.province || null,
            district: values.district?.trim() || null,
            address: values.address?.trim() || null,
            isActive: true,
        });
        facilityForm.resetFields();
    };

    const onUpdateFacility = async (values: IFacilityFormValues): Promise<void> => {
        if (!editingFacility) {
            return;
        }

        await updateFacility({
            id: editingFacility.id,
            name: values.name.trim(),
            code: values.code?.trim() || null,
            facilityType: values.facilityType || null,
            province: values.province || null,
            district: values.district?.trim() || null,
            address: values.address?.trim() || null,
            isActive: editingFacility.isActive,
        });
        setEditingFacility(null);
    };

    const onAssignFacility = async (clinicianUserId: number): Promise<void> => {
        const facilityId = assigningFacilityByUserId[clinicianUserId];
        if (!facilityId) {
            messageApi.warning("Select a facility before assigning.");
            return;
        }

        await assignClinicianFacility(clinicianUserId, facilityId);
    };

    return {
        messageContextHolder,
        facilities,
        activeFacilities,
        filteredUsers,
        governanceStats,
        isLoadingUsers,
        isLoadingFacilities,
        isMutating,
        searchText,
        approvalFilter,
        decisionTargetUserId,
        decisionMode,
        decisionForm,
        facilityForm,
        editingFacility,
        editFacilityForm,
        assigningFacilityByUserId,
        setSearchText,
        setApprovalFilter: (value: ApprovalFilter) => setApprovalFilter(value),
        onSubmitDecision,
        onCreateFacility,
        onUpdateFacility,
        onAssignFacility,
        setDecisionTargetUserId,
        openDecisionModal,
        setEditingFacility,
        setAssigningFacilityByUserId,
        setFacilityActivation,
    };
};
