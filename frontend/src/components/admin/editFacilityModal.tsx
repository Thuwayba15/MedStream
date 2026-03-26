import { Button, Form, Input, Modal, Select, Space } from "antd";
import type { FormInstance } from "antd";
import { FACILITY_TYPE_OPTIONS, PROVINCE_OPTIONS } from "@/constants/adminGovernance";
import { type IFacility } from "@/providers/admin-governance/context";
import { type IFacilityFormValues } from "@/components/admin/types";

interface IEditFacilityModalProps {
    editingFacility: IFacility | null;
    isMutating: boolean;
    editFacilityForm: FormInstance<IFacilityFormValues>;
    onUpdateFacility: (values: IFacilityFormValues) => Promise<void>;
    setEditingFacility: React.Dispatch<React.SetStateAction<IFacility | null>>;
}

export function EditFacilityModal({
    editingFacility,
    isMutating,
    editFacilityForm,
    onUpdateFacility,
    setEditingFacility,
}: IEditFacilityModalProps): React.JSX.Element {
    return (
        <Modal title="Edit Facility" open={editingFacility !== null} onCancel={() => setEditingFacility(null)} footer={null} destroyOnHidden>
            <Form<IFacilityFormValues> form={editFacilityForm} layout="vertical" onFinish={(values) => void onUpdateFacility(values)}>
                <Form.Item label="Facility name" name="name" rules={[{ required: true, message: "Facility name is required." }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Code" name="code">
                    <Input />
                </Form.Item>
                <Form.Item label="Facility type" name="facilityType" rules={[{ required: true, message: "Select a facility type." }]}>
                    <Select showSearch optionFilterProp="label" options={FACILITY_TYPE_OPTIONS} data-testid="edit-facility-type-select" />
                </Form.Item>
                <Form.Item label="Province" name="province" rules={[{ required: true, message: "Select a province." }]}>
                    <Select showSearch optionFilterProp="label" options={PROVINCE_OPTIONS} data-testid="edit-facility-province-select" />
                </Form.Item>
                <Form.Item label="District" name="district">
                    <Input />
                </Form.Item>
                <Form.Item label="Address" name="address">
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Space>
                    <Button onClick={() => setEditingFacility(null)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={isMutating}>
                        Save
                    </Button>
                </Space>
            </Form>
        </Modal>
    );
}
