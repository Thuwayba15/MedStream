import { Button, Form, Input, Modal, Space } from "antd";
import type { FormInstance } from "antd";
import { type IDecisionFormValues } from "@/components/admin/types";

interface IDecisionModalProps {
    decisionMode: "approve" | "decline";
    decisionTargetUserId: number | null;
    isMutating: boolean;
    decisionForm: FormInstance<IDecisionFormValues>;
    onSubmitDecision: (values: IDecisionFormValues) => Promise<void>;
    setDecisionTargetUserId: React.Dispatch<React.SetStateAction<number | null>>;
}

export const DecisionModal = ({ decisionMode, decisionTargetUserId, isMutating, decisionForm, onSubmitDecision, setDecisionTargetUserId }: IDecisionModalProps) => {
    return (
        <Modal
            title={decisionMode === "approve" ? "Approve Clinician" : "Decline Clinician"}
            open={decisionTargetUserId !== null}
            onCancel={() => setDecisionTargetUserId(null)}
            footer={null}
        >
            <Form<IDecisionFormValues> form={decisionForm} layout="vertical" onFinish={(values) => void onSubmitDecision(values)}>
                <Form.Item
                    label="Decision reason"
                    name="decisionReason"
                    rules={[
                        { required: true, message: "Decision reason is required." },
                        { min: 3, message: "Decision reason must be at least 3 characters." },
                    ]}
                >
                    <Input.TextArea rows={4} placeholder="Provide the reason for this decision." />
                </Form.Item>

                <Space>
                    <Button onClick={() => setDecisionTargetUserId(null)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={isMutating}>
                        {decisionMode === "approve" ? "Approve Clinician" : "Decline Clinician"}
                    </Button>
                </Space>
            </Form>
        </Modal>
    );
};
