import { Button, Form, Input, Select } from "antd";
import type { FormInstance } from "antd";
import { FACILITY_TYPE_OPTIONS, PROVINCE_OPTIONS } from "@/constants/adminGovernance";
import { type IFacilityFormValues } from "@/components/admin/types";

interface IFacilityCreateFormProps {
    form: FormInstance<IFacilityFormValues>;
    isMutating: boolean;
    adminStyles: Record<string, string>;
    onCreateFacility: (values: IFacilityFormValues) => Promise<void>;
}

export const FacilityCreateForm = ({ form, isMutating, adminStyles, onCreateFacility }: IFacilityCreateFormProps) => {
    return (
        <Form<IFacilityFormValues> form={form} layout="vertical" onFinish={(values) => void onCreateFacility(values)}>
            <div className={adminStyles.facilityFormGrid}>
                <Form.Item name="name" label="Facility name" rules={[{ required: true, message: "Facility name is required." }]}>
                    <Input placeholder="Facility name" />
                </Form.Item>
                <Form.Item name="code" label="Code">
                    <Input placeholder="Code" />
                </Form.Item>
                <Form.Item name="facilityType" label="Type" rules={[{ required: true, message: "Select a facility type." }]}>
                    <Select showSearch optionFilterProp="label" options={FACILITY_TYPE_OPTIONS} placeholder="Select type" data-testid="create-facility-type-select" />
                </Form.Item>
                <Form.Item name="province" label="Province" rules={[{ required: true, message: "Select a province." }]}>
                    <Select showSearch optionFilterProp="label" options={PROVINCE_OPTIONS} placeholder="Select province" data-testid="create-facility-province-select" />
                </Form.Item>
                <Form.Item name="district" label="District">
                    <Input placeholder="District" />
                </Form.Item>
                <Form.Item name="address" label="Address">
                    <Input placeholder="Address" />
                </Form.Item>
            </div>
            <Button type="primary" htmlType="submit" loading={isMutating} className={adminStyles.primaryActionButton}>
                Add Facility
            </Button>
        </Form>
    );
};
