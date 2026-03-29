"use client";

import { UserOutlined } from "@ant-design/icons";
import { Avatar, Layout, Menu, Space } from "antd";
import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logoutButton";
import { useRoleShellStyles } from "@/components/layout/style";

const { Header, Content } = Layout;

export interface IRoleSidebarItem {
    key: string;
    label: string;
    href: string;
}

interface IRoleAppShellProps {
    roleLabel: string;
    activeKey?: string;
    items: IRoleSidebarItem[];
    children: React.ReactNode;
}

const TopNavigation = ({ roleLabel, activeKey, items }: Pick<IRoleAppShellProps, "roleLabel" | "activeKey" | "items">) => {
    const { styles } = useRoleShellStyles();

    return (
        <Header className={styles.topHeader}>
            <div className={styles.headerInner}>
                <div className={styles.brandBlock} aria-label={`MedStream ${roleLabel} workspace`}>
                    <span className={styles.brandMark} aria-hidden>
                        <Image src="/logo_inverted.png" alt="" width={38} height={38} />
                    </span>
                    <span className={styles.brandText}>
                        Med<span className={styles.brandAccent}>Stream</span>
                    </span>
                </div>

                {items.length > 0 ? (
                    <Menu
                        mode="horizontal"
                        selectedKeys={activeKey ? [activeKey] : []}
                        className={styles.topMenu}
                        items={items.map((item) => ({
                            key: item.key,
                            label: <Link href={item.href}>{item.label}</Link>,
                        }))}
                    />
                ) : (
                    <div className={styles.menuSpacer} />
                )}

                <Space size={10} className={styles.actionArea}>
                    <Avatar icon={<UserOutlined />} className={styles.profileAvatar} />
                    <LogoutButton className={styles.logoutButton} />
                </Space>
            </div>
        </Header>
    );
};

export const RoleAppShell = ({ roleLabel, activeKey, items, children }: IRoleAppShellProps) => {
    const { styles } = useRoleShellStyles();

    return (
        <Layout className={styles.root}>
            <TopNavigation roleLabel={roleLabel} activeKey={activeKey} items={items} />
            <Content className={styles.content}>
                <div className={styles.contentInner}>{children}</div>
            </Content>
        </Layout>
    );
};
